let Evented = require("utils/Evented");
let bindFunctions = require("utils/bindFunctions");
let Cursor = require("modules/utils/Cursor");
let Selection = require("modules/utils/Selection");
let AstSelection = require("modules/utils/AstSelection");
let astCommon = require("modules/astCommon");

let SelectionUtils = require("./utils/Selection");
let AstSelectionUtils = require("./utils/AstSelection");
let wrapLine = require("./utils/wrapLine");
let canvasUtils = require("./utils/canvasUtils");
let Renderer = require("./render/Renderer");

let {s: a} = AstSelection;
let {c} = Cursor;
let {s} = Selection;

class View extends Evented {
	constructor(document) {
		super();
		
		this.Selection = bindFunctions(this, SelectionUtils);
		this.AstSelection = bindFunctions(this, AstSelectionUtils);
		
		Object.assign(this, canvasUtils);
		
		this.document = document;
		
		this.focused = false;
		this.visible = false;
		this.mounted = false;
		
		this.mode = "normal";
		
		this.normalSelection = s(c(2, 7), c(3, 10));
		
		// for remembering the "intended" col when moving a cursor up/down to a line
		// that doesn't have as many cols as the cursor
		this.selectionEndCol = 0;
		
		this.astSelection = null;
		
		this.updateAstSelectionFromNormalSelection();
		
		this.folds = {};
		
		this.pickOptions = [];
		this.dropTargets = [];
		
		this.scrollPosition = {
			x: 0,
			y: 0,
		};
		
		this.normalHilites = [];
		
		this.insertCursor = null;
		this.astSelectionHilite = null;
		this.astInsertionHilite = null;
		
		this.completions = null;
		
		this.cursorBlinkOn = false;
		this.cursorInterval = null;
		
		this.batchDepth = 0;
		this.hasBatchedUpdates = false;
		
		this.topMargin = 2;
		
		this.marginStyle = {
			margin: 2,
			paddingLeft: 3,
			paddingRight: 7,
		};
		
		this.measurements = {
			rowHeight: 20,
			colWidth: 8,
		};
		
		this.updateSizes(800, 600);
		
		this.wrap = base.getPref("wrap");
		
		this.updateWrappedLines();
		
		this.blur = this.blur.bind(this);
		
		this.teardownCallbacks = [
			document.on("edit fileDetailsChanged", () => this.batchRedraw()),
		];
	}
	
	render(canvas, uiState) {
		let renderer = new Renderer(this, canvas, uiState);
		
		renderer.render();
	}
	
	updateWrappedLines() {
		this.wrappedLines = this.document.lines.map((line, lineIndex) => {
			return wrapLine(
				this.wrap,
				line,
				this.folds[lineIndex],
				this.document.fileDetails.indentation,
				this.measurements,
				this.sizes.codeWidth,
			);
		});
		
		this.batchRedraw();
	}
	
	switchToAstMode() {
		this.mode = "ast";
		
		this.clearCursorBlink();
		
		this.fire("modeSwitch");
		
		this.batchRedraw();
	}
	
	switchToNormalMode() {
		this.mode = "normal";
		this.astSelectionHilite = null;
		
		this.startCursorBlink();
		this.batchRedraw();
		
		this.fire("modeSwitch");
	}
	
	get lines() {
		return this.document.lines;
	}
	
	get lang() {
		if (this.mode === "ast") {
			return this.document.langFromAstSelection(this.astSelection);
		} else {
			let startLang = this.document.langFromCursor(this.normalSelection.start);
			let endLang = this.document.langFromCursor(this.normalSelection.end);
			
			if (startLang === endLang) {
				return startLang;
			} else {
				return this.document.lang;
			}
		}
	}
	
	showPickOptionsFor(astSelection) {
		if (!astSelection) {
			this.pickOptions = [];
			
			this.fire("updatePickOptions");
			
			return;
		}
		
		let {startLineIndex} = astSelection;
		let lineIndex = startLineIndex;
		let {astMode} = this.document.langFromAstSelection(astSelection);
		
		this.pickOptions = [{
			lineIndex,
			
			options: astCommon.getPickOptions(
				astMode,
				this.document,
				astSelection,
			).map(function(option) {
				return {
					lineIndex,
					option,
				};
			}),
		}];
		
		this.fire("updatePickOptions");
	}
	
	showDropTargets() {
		let byLineIndex = new Map();
		
		let {
			document,
			wrappedLines,
			astSelection,
			astSelectionHilite,
			measurements: {
				rowHeight,
			},
			sizes: {
				height,
			},
		} = this;
		
		let {lineIndex} = this.findFirstVisibleLine();
		
		let rowsToRender = height / rowHeight;
		let rowsRenderedOrSkipped = 0;
		
		while (lineIndex < wrappedLines.length) {
			let wrappedLine = wrappedLines[lineIndex];
			let {line} = wrappedLine;
			
			if (
				AstSelection.lineIsWithinSelection(lineIndex, astSelection)
				|| astSelectionHilite && AstSelection.lineIsWithinSelection(lineIndex, astSelectionHilite)
			) {
				lineIndex++;
				
				continue;
			}
			
			let {astMode} = document.langFromLineIndex(lineIndex);
			
			if (!astMode) {
				lineIndex++;
				rowsRenderedOrSkipped += wrappedLine.height;
				
				continue;
			}
			
			byLineIndex.set(lineIndex, astCommon.getDropTargets(
				astMode,
				document,
				lineIndex,
			).map(function(target) {
				return {
					lineIndex,
					target,
				};
			}));
			
			rowsRenderedOrSkipped += wrappedLine.height;
			
			if (rowsRenderedOrSkipped >= rowsToRender) {
				break;
			}
			
			lineIndex++;
		}
		
		this.dropTargets = [...byLineIndex.entries()].map(function([lineIndex, targets]) {
			return {
				lineIndex,
				targets,
			};
		});
		
		this.fire("updateDropTargets");
	}
	
	clearDropTargets() {
		this.dropTargets = [];
		
		this.fire("updateDropTargets");
	}
	
	startBatch() {
		this.batchDepth++;
	}
	
	endBatch() {
		this.batchDepth--;
		
		if (!this.inBatch) {
			if (this.hasBatchedUpdates) {
				this.redraw();
			}
			
			this.hasBatchedUpdates = false;
		}
	}
	
	get inBatch() {
		return this.batchDepth > 0;
	}
	
	batchRedraw() {
		if (this.inBatch) {
			this.hasBatchedUpdates = true;
			
			return;
		}
		
		this.redraw();
	}
	
	scrollBy(x, y) {
		let scrolled = false;
		
		let {
			measurements: {colWidth, rowHeight},
			sizes: {codeWidth},
		} = this;
		
		if (x !== 0 && !this.wrap) {
			let longestLineWidth = this.document.getLongestLineWidth();
			let scrollWidth = longestLineWidth * colWidth + codeWidth;
			let scrollMax = scrollWidth - codeWidth;
			let newX = Math.round(this.scrollPosition.x + x);
			
			newX = Math.max(0, newX);
			newX = Math.min(newX, scrollMax);
			
			this.scrollPosition.x = newX;
			
			scrolled = true;
		}
		
		if (y !== 0) {
			let newY = this.scrollPosition.y + y;
			
			newY = Math.max(0, newY);
			newY = Math.min(newY, (this.countLineRowsFolded() - 1) * rowHeight);
			
			scrolled = newY !== this.scrollPosition.y;
			
			this.scrollPosition.y = newY;
		}
		
		if (scrolled) {
			this.fire("scroll");
			
			this.batchRedraw();
		}
		
		return scrolled;
	}
	
	setVerticalScrollNoValidate(y) {
		this.scrollPosition.y = Math.max(0, y);
		
		this.fire("scroll");
		
		this.batchRedraw();
	}
	
	setHorizontalScrollNoValidate(x) {
		if (this.wrap && x !== 0) {
			return;
		}
		
		this.scrollPosition.x = x;
		
		this.fire("scroll");
		
		this.batchRedraw();
	}
	
	setScrollPosition(scrollPosition) {
		this.scrollPosition = {...scrollPosition};
		
		if (this.wrap) {
			this.scrollPosition.x = 0;
		}
		
		this.updateScrollbars();
		
		this.fire("scroll");
	}
	
	scrollPage(dir) {
		let {rows} = this.sizes;
		
		this.scrollBy(0, rows * dir);
	}
	
	scrollPageDown() {
		this.scrollPage(1);
	}
	
	scrollPageUp() {
		this.scrollPage(-1);
	}
	
	ensureSelectionIsOnScreen() {
		if (this.mode === "ast") {
			this.ensureAstSelectionIsOnScreen();
		} else {
			this.ensureNormalCursorIsOnScreen();
		}
	}
	
	ensureAstSelectionIsOnScreen() {
		let {height} = this.sizes;
		let {startLineIndex, endLineIndex} = this.astSelection;
		
		let topY = this.screenYFromLineIndex(startLineIndex);
		let bottomY = this.screenYFromLineIndex(endLineIndex);
		let selectionHeight = bottomY - topY;
		let bottomDistance = height - bottomY;
		
		let idealBuffer = this.measurements.rowHeight * 5;
		let spaceAvailable = height - selectionHeight;
		
		if (spaceAvailable >= idealBuffer * 2) {
			let topBuffer = Math.max(idealBuffer, topY);
			let topDiff = topBuffer - topY;
			let newBottomDistance = bottomDistance + topDiff;
			let idealBottomBuffer = Math.max(idealBuffer, newBottomDistance);
			
			let bottomDiff = idealBottomBuffer - newBottomDistance;
			
			this.scrollBy(0, -topDiff + bottomDiff);
		} else {
			let topBuffer = Math.max(0, spaceAvailable / 2);
			let topDiff = topBuffer - topY;
			
			this.scrollBy(0, -topDiff);
		}
	}
	
	ensureNormalCursorIsOnScreen() {
		let {
			scrollPosition,
			measurements,
		} = this;
		
		let {codeWidth: width, rows} = this.sizes;
		let {colWidth, rowHeight} = measurements;
		
		let {end} = this.normalSelection;
		let {lineIndex, offset} = end;
		let [row, col] = this.rowColFromCursor(end);
		
		let maxRow = this.countLineRowsFolded() - 1;
		let firstVisibleRow = Math.floor(scrollPosition.y / rowHeight);
		let firstFullyVisibleRow = Math.ceil(scrollPosition.y / rowHeight);
		let lastFullyVisibleRow = firstVisibleRow + rows;
		
		let idealRowBuffer = 5;
		
		let topRowDiff = idealRowBuffer - (row - firstFullyVisibleRow);
		
		if (topRowDiff > 0) {
			scrollPosition.y = Math.max(0, scrollPosition.y - topRowDiff * rowHeight);
		}
		
		let bottomRowDiff = idealRowBuffer - (lastFullyVisibleRow - row);
		
		if (bottomRowDiff > 0) {
			scrollPosition.y = Math.min(scrollPosition.y + bottomRowDiff * rowHeight, maxRow * rowHeight);
		}
		
		if (!this.wrap) {
			let colBuffer = colWidth * 4;
			
			let [x] = this.screenCoordsFromRowCol(row, col);
			
			x -= this.sizes.marginOffset;
			
			if (x < 1) {
				scrollPosition.x = Math.max(0, x - colBuffer);
			}
			
			if (x > this.sizes.codeWidth - colBuffer) {
				scrollPosition.x += x - this.sizes.codeWidth + colBuffer;
			}
		}
		
		this.fire("scroll");
	}
	
	setNormalSelection(selection) {
		this.normalSelection = this.Selection.validate(selection);
		
		// TODO validate for folds
		
		this.updateAstSelectionFromNormalSelection();
		
		this.batchRedraw();
	}
	
	validateSelection() {
		if (this.mode === "normal") {
			this.setNormalSelection(this.normalSelection);
		} else {
			this.setAstSelection(this.astSelection);
		}
	}
	
	setInsertCursor(cursor) {
		this.insertCursor = cursor;
		
		this.batchRedraw();
	}
	
	setAstSelection(astSelection) {
		this.astSelection = astCommon.selection.trim(this.document, this.AstSelection.validate(astSelection));
		this.astSelectionHilite = null;
		
		// TODO validate for folds
		
		this.updateNormalSelectionFromAstSelection();
		
		this.batchRedraw();
	}
	
	setAstSelectionHilite(astSelection) {
		this.astSelectionHilite = astSelection;
		
		this.batchRedraw();
	}
	
	setAstInsertionHilite(astSelection) {
		this.astInsertionHilite = astSelection;
		
		this.batchRedraw();
	}
	
	updateSelectionEndCol() {
		let [, endCol] = this.rowColFromCursor(this.normalSelection.end);
		
		this.selectionEndCol = endCol;
	}
	
	updateNormalSelectionFromAstSelection() {
		this.normalSelection = this.Selection.endOfLineContent(this.astSelection.endLineIndex - 1);
		
		this.updateSelectionEndCol();
		
		this.batchRedraw();
	}
	
	updateAstSelectionFromNormalSelection() {
		let {document} = this;
		let {start, end} = Selection.sort(this.normalSelection);
		let {astMode} = this.lang;
		
		this.astSelection = astCommon.selection.fromLineRange(document, start.lineIndex, end.lineIndex + 1);
		
		this.batchRedraw();
	}
	
	getNormalSelectionForFind() {
		return this.mode === "ast" ? this.Selection.fromAstSelection(this.normalSelection) : this.Selection.sort();
	}
	
	setFolds(folds) {
		this.folds = folds;
		
		// TODO validate selection
		
		this.batchRedraw();
	}
	
	setNormalHilites(hilites) {
		this.normalHilites = hilites;
		
		this.batchRedraw();
	}
	
	setWrap(wrap) {
		if (this.wrap === wrap) {
			return;
		}
		
		this.wrap = wrap;
		
		if (this.wrap) {
			this.setHorizontalScrollNoValidate(0);
		}
		
		this.updateWrappedLines();
		
		this.fire("wrapChanged", wrap);
		
		this.batchRedraw();
	}
	
	setCompletions(completions) {
		this.completions = completions;
		
		this.fire("updateCompletions");
	}
	
	setMeasurements(measurements) {
		this.measurements = measurements;
		
		this.fire("updateMeasurements");
	}
	
	setCanvasSize(width, height) {
		this.updateSizes(width, height);
	}
	
	updateSizes(width=null, height=null) {
		if (width === null && height === null) {
			({width, height} = this.sizes);
		}
		
		let {
			lines,
			topMargin,
			marginStyle,
			measurements,
		} = this;
		
		let {
			colWidth,
			rowHeight,
		} = measurements;
		
		let marginWidth = Math.round(marginStyle.paddingLeft + String(lines.length).length * measurements.colWidth + marginStyle.paddingRight);
		let marginOffset = marginWidth + marginStyle.margin;
		let codeWidth = width - marginOffset;
		
		this.sizes = {
			width,
			height,
			topMargin,
			marginWidth,
			marginOffset,
			marginStyle,
			codeWidth: width - marginOffset,
			rows: Math.floor(height / rowHeight),
			cols: Math.floor(codeWidth / colWidth),
		};
		
		this.fire("updateSizes");
		
		this.batchRedraw();
	}
	
	updateMarginSize() {
		let {marginWidth} = this.sizes;
		
		this.startBatch();
		
		this.updateSizes();
		
		if (marginWidth !== this.sizes.marginWidth) {
			this.updateWrappedLines();
		}
		
		this.endBatch();
	}
	
	startCursorBlink() {
		if (!this.visible) {
			return;
		}
		
		if (this.mode !== "normal") {
			return;
		}
		
		if (this.cursorInterval) {
			clearInterval(this.cursorInterval);
		}
		
		this.cursorBlinkOn = true;
		
		this.cursorInterval = setInterval(() => {
			this.cursorBlinkOn = !this.cursorBlinkOn;
			
			this.updateCanvas();
		}, base.prefs.cursorBlinkPeriod);
		
		this.batchRedraw();
	}
	
	clearCursorBlink() {
		if (this.cursorInterval) {
			clearInterval(this.cursorInterval);
		}
		
		this.cursorInterval = null;
	}
	
	updateCanvas() {
		this.fire("updateCanvas");
	}
	
	updateScrollbars() {
		this.fire("updateScrollbars");
	}
	
	redraw() {
		this.updateCanvas();
		this.updateScrollbars();
	}
	
	show() {
		this.visible = true;
		
		this.fire("show");
		
		this.startCursorBlink();
	}
	
	hide() {
		this.visible = false;
		
		this.clearCursorBlink();
		
		this.fire("hide");
	}
	
	focus() {
		this.focused = true;
		
		this.startCursorBlink();
		
		this.redraw();
		
		this.fire("focus");
	}
	
	blur() {
		this.focused = false;
		
		this.clearCursorBlink();
		
		this.redraw();
		
		this.fire("blur");
	}
	
	requestFocus() {
		if (this.mounted) {
			this.fire("requestFocus");
		} else {
			this.requestFocusOnMount = true;
		}
	}
	
	requestResizeAsync() {
		this.fire("requestResizeAsync");
	}
	
	uiMounted() {
		this.mounted = true;
		
		if (this.requestFocusOnMount) {
			this.requestFocus();
		}
	}
	
	teardown() {
		this.clearCursorBlink();
		
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

module.exports = View;
