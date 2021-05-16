let {on, off} = require("../../utils/dom/domEvents");
let screenOffsets = require("../../utils/dom/screenOffsets");
let autoScroll = require("../../utils/dom/autoScroll");
let calculateMarginOffset = require("../../modules/render/calculateMarginOffset");
let rowColFromScreenCoords = require("../../modules/utils/rowColFromScreenCoords");
let rowColFromCursor = require("../../modules/utils/rowColFromCursor");
let cursorFromRowCol = require("../../modules/utils/cursorFromRowCol");

module.exports = function(editor) {
	function mousedown(e) {
		if (e.button !== 0) {
			return;
		}
		
		let {
			canvas,
			measurements,
			document,
			selection,
			hasHorizontalScrollbar,
			scrollPosition,
			scrollBy,
			setSelection,
			setSelectionEndCol,
			redraw,
			startCursorBlink,
		} = editor;
		
		let {
			x: left,
			y: top,
		} = canvas.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		let [row, col] = rowColFromScreenCoords(
			document.lines,
			x,
			y,
			scrollPosition,
			measurements,
		);
		
		let cursor = cursorFromRowCol(
			document.lines,
			row,
			col,
		);
		
		setSelection({
			start: cursor,
			end: cursor,
		});
		
		let [lineIndex, offset] = cursor;
		let [, endCol] = rowColFromCursor(document.lines, lineIndex, offset);
		
		setSelectionEndCol(endCol);
		
		startCursorBlink();
		
		redraw();
		
		on(window, "mousemove", mousemove);
		on(window, "mouseup", mouseup);
		
		let offsets = screenOffsets(canvas);
		
		offsets.left += calculateMarginOffset(document.lines, measurements);
		
		autoScroll(offsets, function(x, y) {
			let {colWidth} = measurements;
			
			let xOffset = x === 0 ? 0 : Math.round(Math.max(1, Math.abs(x) / colWidth)) * colWidth;
			let rows = y === 0 ? 0 : Math.round(Math.max(1, Math.pow(2, Math.abs(y) / 30)));
			
			if (!hasHorizontalScrollbar) {
				xOffset = 0;
			}
			
			if (x < 0) {
				xOffset = -xOffset;
			}
			
			if (y < 0) {
				rows = -rows;
			}
			
			scrollBy(xOffset, rows);
		});
	}
	
	function mousemove(e) {
		let {
			canvas,
			measurements,
			document,
			selection,
			scrollPosition,
			setSelection,
			setSelectionEndCol,
			redraw,
		} = editor;
		
		let {
			x: left,
			y: top,
		} = canvas.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		let [row, col] = rowColFromScreenCoords(
			document.lines,
			x,
			y,
			scrollPosition,
			measurements,
		);
		
		let cursor = cursorFromRowCol(
			document.lines,
			row,
			col,
		);
		
		setSelection({
			...selection,
			end: cursor,
		});
		
		setSelectionEndCol(col);
		
		redraw();
	}
	
	function mouseup(e) {
		editor.mouseup(e);
		
		off(window, "mousemove", mousemove);
		off(window, "mouseup", mouseup);
	}
	
	return {
		mousedown,
	};
}
