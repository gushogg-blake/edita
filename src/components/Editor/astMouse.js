let {on, off} = require("../../utils/dom/domEvents");
let screenOffsets = require("../../utils/dom/screenOffsets");
let autoScroll = require("../../utils/dom/autoScroll");
let calculateMarginOffset = require("../../modules/render/calculateMarginOffset");
let rowColFromScreenCoords = require("../../modules/utils/rowColFromScreenCoords");
let rowColFromCursor = require("../../modules/utils/rowColFromCursor");
let cursorFromRowCol = require("../../modules/utils/cursorFromRowCol");

module.exports = function(editor) {
	let dragging = false;
	
	function hilite(e) {
		let {
			canvas,
			measurements,
			document,
			selection,
			scrollPosition,
			setSelectionHilite,
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
		
		let [lineIndex] = cursorFromRowCol(document.lines, row, col);
		
		setSelectionHilite(document.lang.codeIntel.astSelection.fromLineIndex(document.lines, lineIndex));
		
		redraw();
	}
	
	function mousedown(e) {
		let {
			canvas,
			measurements,
			document,
			selection,
			hasHorizontalScrollbar,
			scrollBy,
			scrollPosition,
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
		
		let [lineIndex, offset] = cursor;
		
		dragging = true;
		
		on(window, "mousemove", drag);
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
	
	function drag(e) {
		
	}
	
	function mousemove(e) {
		if (dragging) {
			return;
		}
		
		hilite(e);
		
		console.log(e);
	}
	
	function mouseup(e) {
		editor.mouseup(e);
		
		dragging = false;
		
		off(window, "mousemove", drag);
		off(window, "mouseup", mouseup);
	}

	return {
		mousedown,
		mousemove,
	};
}
