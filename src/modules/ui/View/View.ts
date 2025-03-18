import Evented from "utils/Evented";
import bindFunctions from "utils/bindFunctions";
import mapArrayToObject from "utils/mapArrayToObject";
import Cursor, {c} from "modules/core/Cursor";
import Selection, {s} from "modules/core/Selection";
import AstSelection, {a} from "modules/core/AstSelection";
import astCommon from "modules/astCommon";

import SelectionUtils from "./utils/Selection";
import AstSelectionUtils from "./utils/AstSelection";
import wrapLine from "./utils/wrapLine";
import canvasUtils from "./utils/canvasUtils";
import Renderer from "./render/Renderer";

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
		
		this.redrawnWhileHidden = false;
		
		this.mode = "normal";
		
		this.normalSelection = s(c(0, 0));
		
		// for remembering the "intended" col when moving a cursor up/down to a line
		// that doesn't have as many cols as the cursor
		this.selectionEndCol = 0;
		
		this.astSelection = null;
		
		this.updateAstSelectionFromNormalSelection();
		
		this.folds = {};
		
		this.pickOptions = [];
		this.dropTargets = [];
		
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
		
		this.scrollPosition = {
			x: 0,
			y: 0,
		};
		
		this.updateSizes(800, 600);
		
		this.wrap = base.getPref("wrap");
		
		this.updateWrappedLines();
		
		this.blur = this.blur.bind(this);
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
				this.document.format.indentation,
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
	
	showPickOptionsFor(lineIndex) {
		let {document} = this;
		let {astMode} = document.langFromAstSelection(a(lineIndex));
		
		this.pickOptions = [{
			lineIndex,
			
			options: astCommon.getPickOptions(astMode, document, lineIndex).map(function(option) {
				return {
					lineIndex,
					option,
				};
			}),
		}];
		
		this.fire("updatePickOptions");
	}
	
	clearPickOptions() {
		this.pickOptions = [];
		
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
				astSelection.containsLineIndex(lineIndex)
				|| astSelectionHilite?.containsLineIndex(lineIndex)
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
	
	getScrollHeight() {
		let {
			measurements: {rowHeight},
			sizes: {topMargin, height},
		} = this;
		
		let rows = this.countLineRowsFolded();
		
		return rows === 1 ? height : topMargin + (rows - 1) * rowHeight + height;
	}
	
	getScrollWidth() {
		let {
			document,
			measurements: {colWidth},
			sizes: {codeWidth: width},
		} = this;
		
		let longestLineWidth = document.getLongestLineWidth();
		
		return longestLineWidth * colWidth + width;
	}
	
	getVerticalScrollMax() {
		return this.getScrollHeight() - this.sizes.height;
	}
	
	getHorizontalScrollMax() {
		return this.wrap ? 0 : this.getScrollWidth() - this.sizes.codeWidth;
	}
	
	boundedScrollY(y) {
		return Math.max(0, Math.min(y, this.getVerticalScrollMax()));
	}
	
	boundedScrollX(x) {
		return Math.max(0, Math.min(x, this.getHorizontalScrollMax()));
	}
	
	ensureScrollIsWithinBounds() {
		let x = this.boundedScrollX(this.scrollPosition.x);
		let y = this.boundedScrollY(this.scrollPosition.y);
		
		if (x !== this.scrollPosition.x || y !== this.scrollPosition.y) {
			this.setScrollPositionNoValidate({x, y});
		}
	}
	
	scrollBy(x, y) {
		let scrolled = false;
		
		if (x !== 0 && !this.wrap) {
			let newX = Math.round(this.boundedScrollX(this.scrollPosition.x + x));
			
			scrolled = newX !== this.scrollPosition.x;
			
			this.scrollPosition.x = newX;
		}
		
		if (y !== 0) {
			let newY = this.boundedScrollY(this.scrollPosition.y + y);
			
			scrolled = newY !== this.scrollPosition.y;
			
			this.scrollPosition.y = newY;
		}
		
		if (scrolled) {
			this.fire("scroll");
			
			this.batchRedraw();
		}
		
		return scrolled;
	}
	
	scrollTo(x, y) {
		this.setScrollPosition({x, y});
	}
	
	setVerticalScrollPosition(position) {
		this.setVerticalScrollNoValidate(Math.round(this.getVerticalScrollMax() * position));
	}
	
	setHorizontalScrollPosition(position) {
		this.setHorizontalScrollNoValidate(Math.round(this.getHorizontalScrollMax() * position));
	}
	
	setVerticalScrollNoValidate(y) {
		this.scrollPosition.y = y;
		
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
		let {x, y} = scrollPosition;
		
		this.scrollPosition = {
			x: this.boundedScrollX(x),
			y: this.boundedScrollY(y),
		};
		
		this.updateScrollbars();
		
		this.fire("scroll");
	}
	
	setScrollPositionNoValidate(scrollPosition) {
		this.scrollPosition = {...scrollPosition};
		
		this.updateScrollbars();
		
		this.fire("scroll");
	}
	
	/*
	ensure scroll position is still valid after e.g. resizing, which
	can change the height if wrapping is enabled
	*/
	
	validateScrollPosition() {
		this.setScrollPosition(this.scrollPosition);
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
		
		let idealRowBufferTop = rows > 10 ? 5 : 0;
		let idealRowBufferBottom = rows > 10 ? 5 : 1;
		
		let topRowDiff = idealRowBufferTop - (row - firstFullyVisibleRow);
		
		if (topRowDiff > 0) {
			scrollPosition.y = Math.max(0, scrollPosition.y - topRowDiff * rowHeight);
		}
		
		let bottomRowDiff = idealRowBufferBottom - (lastFullyVisibleRow - row);
		
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
	
	setNormalSelection(selection, updateAstSelection=true) {
		this.normalSelection = this.Selection.validate(selection);
		
		// TODO validate for folds
		
		if (updateAstSelection) {
			this.updateAstSelectionFromNormalSelection();
		}
		
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
	
	clearAstSelectionHilite() {
		this.astSelectionHilite = null;
		
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
		this.normalSelection = this.Selection.endOfLineContent(Math.max(0, this.astSelection.endLineIndex - 1));
		
		this.updateSelectionEndCol();
		
		this.batchRedraw();
	}
	
	updateAstSelectionFromNormalSelection() {
		let {document} = this;
		let {left, right} = this.normalSelection;
		let {astMode} = this.lang;
		
		this.astSelection = astCommon.selection.fromLineRange(document, left.lineIndex, right.lineIndex + 1);
		
		this.batchRedraw();
	}
	
	getNormalSelectionForFind() {
		return this.mode === "ast" ? this.Selection.fromAstSelection(this.normalSelection) : this.normalSelection.sort();
	}
	
	setFolds(folds) {
		this.folds = folds;
		
		// TODO validate selection
		
		this.batchRedraw();
	}
	
	toggleFoldHeader(lineIndex) {
		let {document} = this;
		let footerLineIndex = astCommon.getFooterLineIndex(document, lineIndex);
		
		if (lineIndex in this.folds) {
			delete this.folds[lineIndex];
			
			return;
		}
		
		if (footerLineIndex === null) {
			return;
		}
		
		this.folds[lineIndex] = footerLineIndex + 1;
		
		this.batchRedraw();
	}
	
	adjustFoldsForEdit(edit) {
		let {selection, newSelection} = edit;
		let origEndLineIndex = selection.end.lineIndex;
		let newEndLineIndex = newSelection.end.lineIndex;
		let diff = newEndLineIndex - origEndLineIndex;
		
		this.folds = mapArrayToObject(Object.entries(this.folds), function([lineIndex, foldTo]) {
			lineIndex = Number(lineIndex);
			
			if (lineIndex > origEndLineIndex) {
				lineIndex += diff;
				foldTo += diff;
			}
			
			return [lineIndex, foldTo];
		});
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
		
		this.updateSizes();
	}
	
	setCanvasSize(width, height) {
		this.startBatch();
		
		this.updateSizes(width, height);
		this.updateWrappedLines();
		this.validateScrollPosition();
		
		this.endBatch();
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
		if (this.visible) {
			this.updateCanvas();
			this.updateScrollbars();
		} else {
			this.redrawnWhileHidden = true;
		}
	}
	
	show() {
		this.visible = true;
		
		if (this.redrawnWhileHidden) {
			this.redraw();
		}
		
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
	}
}

export default View;
