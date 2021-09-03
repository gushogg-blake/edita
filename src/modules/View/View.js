let Evented = require("utils/Evented");
let bindFunctions = require("utils/bindFunctions");
let Cursor = require("modules/utils/Cursor");
let Selection = require("modules/utils/Selection");
let AstSelection = require("modules/utils/AstSelection");
let astCommon = require("modules/langs/common/astMode");

let calculateMarginOffset = require("./canvas/utils/calculateMarginOffset");
let calculateMarginWidth = require("./canvas/utils/calculateMarginWidth");
let calculateNormalSelectionRegions = require("./canvas/utils/calculateNormalSelectionRegions");
let countRows = require("./canvas/utils/countRows");
let cursorFromRowCol = require("./canvas/utils/cursorFromRowCol");
let cursorFromScreenCoords = require("./canvas/utils/cursorFromScreenCoords");
let cursorRowColFromScreenCoords = require("./canvas/utils/cursorRowColFromScreenCoords");
let findFirstVisibleLine = require("./canvas/utils/findFirstVisibleLine");
let getLineRangeTotalHeight = require("./canvas/utils/getLineRangeTotalHeight");
let getLineStartingRow = require("./canvas/utils/getLineStartingRow");
let innerLineIndexAndOffsetFromCursor = require("./canvas/utils/innerLineIndexAndOffsetFromCursor");
let insertLineIndexFromScreenY = require("./canvas/utils/insertLineIndexFromScreenY");
let rowColFromCursor = require("./canvas/utils/rowColFromCursor");
let rowColFromScreenCoords = require("./canvas/utils/rowColFromScreenCoords");
let screenCoordsFromCursor = require("./canvas/utils/screenCoordsFromCursor");
let screenCoordsFromRowCol = require("./canvas/utils/screenCoordsFromRowCol");
let screenRowFromLineIndex = require("./canvas/utils/screenRowFromLineIndex");

let topMargin = require("./canvas/topMargin");
let marginStyle = require("./canvas/marginStyle");

let SelectionUtils = require("./utils/Selection");
let AstSelectionUtils = require("./utils/AstSelection");
let wrapLine = require("./utils/wrapLine");

let {s: a} = AstSelection;
let {c} = Cursor;
let {s} = Selection;

class View extends Evented {
	constructor(app, document) {
		super();
		
		this.Selection = bindFunctions(this, SelectionUtils);
		this.AstSelection = bindFunctions(this, AstSelectionUtils);
		
		this.app = app;
		this.document = document;
		
		this.focused = false;
		this.visible = false;
		
		this.mode = "normal";
		
		this.normalSelection = s(c(0, 0));
		
		// for remembering the "intended" col when moving a cursor up/down to a line
		// that doesn't have as many cols as the cursor
		this.selectionEndCol = 0;
		
		this.astSelection = null;
		
		this.updateAstSelectionFromNormalSelection();
		
		this.pickOptions = [];
		this.dropTargets = [];
		
		this.scrollPosition = {
			row: 0,
			x: 0,
		};
		
		this.normalHilites = [];
		
		this.insertCursor = null;
		this.astSelectionHilite = null;
		this.astInsertionHilite = null;
		
		this.cursorBlinkOn = false;
		this.cursorInterval = null;
		
		this.measurements = {
			rowHeight: 0,
			colWidth: 0,
		};
		
		this.updateSizes(800, 600);
		
		this.updateWrappedLines();
		
		this.blur = this.blur.bind(this);
	}
	
	getLinesToRender() {
		
		let rowsToRender = height / rowHeight;
		let rowsRendered = 0;
		
		let firstVisibleLine = view.findFirstVisibleLine();
		
		/*
		when switching away from a tab the view will unwrap all lines, so if the last
		line is wrapped and we're scrolled right to the bottom, there will be no
		visible line at first when switching back to the tab.  the next resize will
		re-wrap the lines and rerender.
		*/
		
		if (!firstVisibleLine) {
			return;
		}
		
		let {
			lineIndex: firstLineIndex,
			lineRowIndex,
		} = firstVisibleLine;
		
		let lineIndex = firstLineIndex;
		
	}
	
	updateWrappedLines() {
		this.wrappedLines = this.document.lines.map((line) => {
			return wrapLine(line, this.document.fileDetails.indentation, this.measurements, this.sizes.codeWidth);
		});
	}
	
	calculateMarginOffset() {
		return calculateMarginOffset(this.wrappedLines, this.measurements);
	}
	
	calculateMarginWidth() {
		return calculateMarginWidth(this.wrappedLines, this.measurements);
	}
	
	calculateNormalSelectionRegions(selection) {
		return calculateNormalSelectionRegions(this.wrappedLines, selection, this.scrollPosition, this.measurements);
	}
	
	countRows() {
		return countRows(this.wrappedLines);
	}
	
	cursorFromRowCol(row, col, beforeTab=false) {
		return cursorFromRowCol(this.wrappedLines, row, col, beforeTab);
	}
	
	cursorFromScreenCoords(x, y) {
		return cursorFromScreenCoords(this.wrappedLines, x, y, this.scrollPosition, this.measurements);
	}
	
	cursorRowColFromScreenCoords(x, y) {
		return cursorRowColFromScreenCoords(this.wrappedLines, x, y, this.scrollPosition, this.measurements);
	}
	
	findFirstVisibleLine() {
		return findFirstVisibleLine(this.wrappedLines, this.scrollPosition);
	}
	
	getLineRangeTotalHeight(startLineIndex, endLineIndex) {
		return getLineRangeTotalHeight(this.wrappedLines, startLineIndex, endLineIndex);
	}
	
	getLineStartingRow(lineIndex) {
		return getLineStartingRow(this.wrappedLines, lineIndex);
	}
	
	innerLineIndexAndOffsetFromCursor(lineIndex, offset) {
		return innerLineIndexAndOffsetFromCursor(this.wrappedLines, lineIndex, offset);
	}
	
	insertLineIndexFromScreenY(y) {
		return insertLineIndexFromScreenY(this.wrappedLines, y, this.scrollPosition, this.measurements);
	}
	
	rowColFromCursor(cursor) {
		return rowColFromCursor(this.wrappedLines, cursor);
	}
	
	rowColFromScreenCoords(x, y) {
		return rowColFromScreenCoords(this.wrappedLines, x, y, this.scrollPosition, this.measurements);
	}
	
	screenCoordsFromCursor(cursor) {
		return screenCoordsFromCursor(this.wrappedLines, cursor, this.scrollPosition, this.measurements);
	}
	
	screenCoordsFromRowCol(row, col) {
		return screenCoordsFromRowCol(this.wrappedLines, row, col, this.scrollPosition, this.measurements);
	}
	
	screenRowFromLineIndex(lineIndex) {
		return screenRowFromLineIndex(this.wrappedLines, lineIndex, this.scrollPosition);
	}
	
	switchToAstMode() {
		this.mode = "ast";
		
		this.fire("modeSwitch");
		this.fire("redraw");
	}
	
	switchToNormalMode() {
		this.mode = "normal";
		this.astSelectionHilite = null;
		this.startCursorBlink();
		
		this.fire("modeSwitch");
		this.fire("redraw");
	}
	
	setMode(mode) {
		if (this.mode === mode) {
			return;
		}
		
		this.mode = mode;
		this.fire("modeSwitch");
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
			return;
		}
		
		let {startLineIndex} = astSelection;
		let lineIndex = startLineIndex;
		let {lines} = this.document;
		let {astMode} = this.document.langFromAstSelection(astSelection);
		
		this.pickOptions = [{
			lineIndex,
			
			options: astMode.generatePickOptions(
				lines,
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
			
			let wrappedLine = wrappedLines[lineIndex];
			let {line} = wrappedLine;
			
			byLineIndex.set(lineIndex, astMode.generateDropTargets(
				document.lines,
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
	
	scrollBy(x, rows) {
		if (x !== 0) {
			let newX = Math.round(this.scrollPosition.x + x);
			
			newX = Math.max(0, newX);
			
			this.scrollPosition.x = newX;
		}
		
		if (rows !== 0) {
			let newRow = this.scrollPosition.row + rows;
			
			newRow = Math.max(0, newRow);
			newRow = Math.min(newRow, this.countRows() - 1);
			
			this.scrollPosition.row = newRow;
		}
		
		this.fire("scroll");
		this.redraw();
	}
	
	setVerticalScroll(row) {
		this.scrollPosition.row = row;
		this.fire("scroll");
	}
	
	setHorizontalScroll(x) {
		this.scrollPosition.x = x;
		this.fire("scroll");
	}
	
	setScrollPosition(scrollPosition) {
		this.scrollPosition = scrollPosition;
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
			if (!Selection.equals(this.normalSelection, this.Selection.all())) {
				this.ensureNormalCursorIsOnScreen();
			}
		}
	}
	
	ensureAstSelectionIsOnScreen() {
		
	}
	
	ensureNormalCursorIsOnScreen() {
		let {
			wrappedLines,
			scrollPosition,
			measurements,
		} = this;
			
		let {codeWidth: width, rows} = this.sizes;
		let {colWidth} = measurements;
		
		let {end} = this.normalSelection;
		let {lineIndex, offset} = end;
		let [row, col] = this.rowColFromCursor(end);
		
		let maxRow = this.countRows() - 1;
		let firstVisibleRow = scrollPosition.row;
		let lastFullyVisibleRow = firstVisibleRow + rows;
		
		let idealRowBuffer = 5;
		
		let topRowDiff = idealRowBuffer - (row - firstVisibleRow);
		
		if (topRowDiff > 0) {
			scrollPosition.row = Math.max(0, scrollPosition.row - topRowDiff);
		}
		
		let bottomRowDiff = idealRowBuffer - (lastFullyVisibleRow - row);
		
		if (bottomRowDiff > 0) {
			scrollPosition.row = Math.min(scrollPosition.row + bottomRowDiff, maxRow);
		}
		
		let colBuffer = colWidth * 8;
		
		let [x] = this.screenCoordsFromRowCol(row, col);
		
		x -= this.sizes.marginOffset;
		
		if (x < 1) {
			scrollPosition.x = Math.max(0, x - colBuffer);
		}
		
		if (x > this.sizes.codeWidth - colBuffer) {
			scrollPosition.x += x - this.sizes.codeWidth + colBuffer;
		}
		
		this.fire("scroll");
	}
	
	setNormalSelection(selection) {
		this.normalSelection = Selection.validate(this.document.lines, selection);
		
		this.updateAstSelectionFromNormalSelection();
	}
	
	setAstSelection(selection) {
		this.astSelection = AstSelection.validate(this.document.lines, selection);
		
		this.updateNormalSelectionFromAstSelection();
	}
	
	updateSelectionEndCol() {
		let [, endCol] = rowColFromCursor(this.wrappedLines, this.normalSelection.end);
		
		this.selectionEndCol = endCol;
	}
	
	updateNormalSelectionFromAstSelection() {
		this.normalSelection = this.Selection.endOfLineContent(this.astSelection.endLineIndex - 1);
		
		this.updateSelectionEndCol();
	}
	
	updateAstSelectionFromNormalSelection() {
		let {document} = this;
		let {start, end} = Selection.sort(this.normalSelection);
		let {astMode} = this.lang;
		
		this.astSelection = astCommon.selection.fromLineRange(document.lines, start.lineIndex, end.lineIndex + 1);
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
			measurements,
		} = this;
		
		let {lines} = this.document;
		
		let {
			colWidth,
			rowHeight,
		} = measurements;
		
		let marginWidth = calculateMarginWidth(lines, measurements);
		let marginOffset = calculateMarginOffset(lines, measurements);
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
	}
	
	updateMarginSize() {
		let {marginWidth} = this.sizes;
		
		this.updateSizes();
		
		if (marginWidth !== this.sizes.marginWidth) {
			this.updateWrappedLines();
		}
	}
	
	startCursorBlink() {
		if (this.cursorInterval) {
			clearInterval(this.cursorInterval);
		}
		
		this.cursorBlinkOn = true;
		
		this.cursorInterval = setInterval(() => {
			this.cursorBlinkOn = !this.cursorBlinkOn;
			
			this.updateCanvas();
		}, platform.prefs.cursorBlinkPeriod);
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
	}
	
	hide() {
		this.visible = false;
		
		this.fire("hide");
	}
	
	focus() {
		this.focused = true;
		
		this.app.focusManager.focus(this.blur);
		
		this.redraw();
	}
	
	blur() {
		this.focused = false;
	}
	
	requestFocus() {
		this.fire("requestFocus");
	}
	
	teardown() {
		this.app.focusManager.teardown(this.blur);
		
		this.clearCursorBlink();
	}
}

module.exports = View;
