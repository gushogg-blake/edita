let Evented = require("../../utils/Evented");
let bindFunctions = require("../../utils/bindFunctions");
let Selection = require("../../modules/utils/Selection");
let AstSelection = require("../../modules/utils/AstSelection");

let calculateMarginOffset = require("./canvas/utils/calculateMarginOffset");
let calculateMarginWidth = require("./canvas/utils/calculateMarginWidth");
let calculateNormalSelectionRegions = require("./canvas/utils/calculateNormalSelectionRegions");
let countRows = require("./canvas/utils/countRows");
let cursorFromRowCol = require("./canvas/utils/cursorFromRowCol");
let cursorFromScreenCoords = require("./canvas/utils/cursorFromScreenCoords");
let cursorRowColFromScreenCoords = require("./canvas/utils/cursorRowColFromScreenCoords");
let findFirstVisibleLine = require("./canvas/utils/findFirstVisibleLine");
let generateRenderCommandsForLine = require("./canvas/utils/generateRenderCommandsForLine");
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

class View extends Evented {
	constructor(document) {
		super();
		
		this.Selection = bindFunctions(this, SelectionUtils);
		this.AstSelection = bindFunctions(this, AstSelectionUtils);
		
		this.document = document;
		
		this.updateWrappedLines();
		
		this.focused = false;
		this.visible = false;
		
		this.mode = "normal";
		
		this.normalSelection = {
			start: [0, 0],
			end: [0, 0],
		};
		
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
		
		this.updateSizes(0, 0);
		
		this.blur = this.blur.bind(this);
	}
	
	updateWrappedLines() {
		this.wrappedLines = this.document.lines.map((line) => {
			let {
				string,
				variableWidthParts,
			} = line;
			
			return {
				line,
				height: 1,
				rows: [
					{
						startOffset: 0,
						string,
						width: line.width,
						variableWidthParts,
					},
				],
			};
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
	
	generateRenderCommandsForLine(line, lineRow) {
		return generateRenderCommandsForLine(line, lineRow);
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
		return insertLineIndexFromScreenY(this.wrappedLines, y);
	}
	
	rowColFromCursor(lineIndex, offset) {
		return rowColFromCursor(this.wrappedLines, lineIndex, offset);
	}
	
	rowColFromScreenCoords(x, y) {
		return rowColFromScreenCoords(this.wrappedLines, x, y, this.scrollPosition, this.measurements);
	}
	
	screenCoordsFromCursor(lineIndex, offset) {
		return screenCoordsFromCursor(this.wrappedLines, lineIndex, offset, this.scrollPosition, this.measurements);
	}
	
	screenCoordsFromRowCol(row, col) {
		return screenCoordsFromRowCol(this.wrappedLines, row, col, this.scrollPosition, this.measurements);
	}
	
	screenRowFromLineIndex(lineIndex) {
		return screenRowFromLineIndex(this.wrappedLines, lineIndex, this.scrollPosition);
	}
	
	showPickOptionsFor(selection) {
		if (!selection) {
			return;
		}
		
		let [startLineIndex] = selection;
		let lineIndex = startLineIndex;
		let {lines} = this.document;
		let {codeIntel} = this.document.lang;
		
		this.pickOptions = [{
			lineIndex,
			
			options: codeIntel.generatePickOptions(
				lines,
				selection,
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
		
		let {lines} = this.document;
		let {codeIntel} = this.document.lang;
		let {lineIndex} = findFirstVisibleLine(lines, scrollPosition);
		
		let rowsToRender = canvas.height / measurements.rowHeight;
		let rowsRendered = 0;
		
		while (lineIndex < lines.length) {
			if (
				AstSelection.lineIsWithinSelection(lineIndex, astSelection)
				|| astSelectionHilite && AstSelection.lineIsWithinSelection(lineIndex, astSelectionHilite)
			) {
				lineIndex++;
				
				continue;
			}
			
			let line = lines[lineIndex];
			
			byLineIndex.set(lineIndex, codeIntel.generateDropTargets(
				lines,
				lineIndex,
			).map(function(target) {
				return {
					lineIndex,
					target,
				};
			}));
			
			rowsRendered += line.height;
			
			if (rowsRendered >= rowsToRender) {
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
		
		this.redraw();
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
		let [lineIndex, offset] = end;
		let [row, col] = this.rowColFromCursor(lineIndex, offset);
		
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
		
		let colBuffer = 8;
		
		let [x] = this.screenCoordsFromRowCol(row, col);
		
		x -= this.sizes.marginOffset;
		
		if (x < 1) {
			scrollPosition.x = Math.max(0, scrollPosition.x - x - colBuffer * colWidth);
		}
	}
	
	setNormalSelection(selection) {
		this.normalSelection = selection;
		
		this.updateAstSelectionFromNormalSelection();
	}
	
	setAstSelection(selection) {
		this.astSelection = selection;
		
		this.updateNormalSelectionFromAstSelection();
	}
	
	updateSelectionEndCol() {
		let [lineIndex, offset] = this.normalSelection.end;
		let [, endCol] = rowColFromCursor(this.wrappedLines, lineIndex, offset);
		
		this.selectionEndCol = endCol;
	}
	
	updateNormalSelectionFromAstSelection() {
		let [, endLineIndex] = this.astSelection;
	
		this.normalSelection = this.Selection.endOfLineContent(endLineIndex - 1);
		
		this.updateSelectionEndCol();
	}
	
	updateAstSelectionFromNormalSelection() {
		let {document} = this;
		let {codeIntel} = document.lang;
		
		let selection = Selection.sort(this.normalSelection);
		let [startLineIndex] = selection.start;
		let [endLineIndex] = selection.end;
		
		this.astSelection = codeIntel.astSelection.fromLineRange(document.lines, startLineIndex, endLineIndex + 1);
	}
	
	updateSizes(width, height) {
		let {
			document,
			wrappedLines,
			measurements,
		} = this;
		
		let {
			colWidth,
			rowHeight,
		} = measurements;
		
		let marginWidth = calculateMarginWidth(wrappedLines, measurements);
		let marginOffset = calculateMarginOffset(wrappedLines, measurements);
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
		
		this.fire("resize");
	}
	
	startCursorBlink() {
		if (this.cursorInterval) {
			clearInterval(this.cursorInterval);
		}
		
		this.cursorBlinkOn = true;
		
		this.cursorInterval = setInterval(() => {
			this.cursorBlinkOn = !this.cursorBlinkOn;
			
			this.updateCanvas();
		}, app.prefs.cursorBlinkPeriod);
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
	
	focus() {
		this.focused = true;
		
		app.focusManager.focus(this.blur);
		
		this.redraw();
	}
	
	blur() {
		this.focused = false;
	}
	
	requestFocus() {
		this.fire("requestFocus");
	}
	
	teardown() {
		app.focusManager.teardown(this.blur);
		
		this.clearCursorBlink();
	}
}

module.exports = View;
