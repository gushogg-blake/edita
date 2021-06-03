let {on, off} = require("../../utils/dom/domEvents");
let screenOffsets = require("../../utils/dom/screenOffsets");
let autoScroll = require("../../utils/dom/autoScroll");
let calculateMarginOffset = require("../../modules/render/calculateMarginOffset");
let rowColFromScreenCoords = require("../../modules/utils/rowColFromScreenCoords");
let rowColFromCursor = require("../../modules/utils/rowColFromCursor");
let cursorFromRowCol = require("../../modules/utils/cursorFromRowCol");
let AstSelection = require("../../modules/utils/AstSelection");
let Selection = require("../../modules/utils/Selection");

module.exports = function(editor) {
	let dragging = false;
	
	function hilite(e) {
		let {
			canvas,
			measurements,
			document,
			selection,
			isPeekingAstMode: isPeeking,
			normalSelection,
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
		
		if (row < document.countRows()) {
			let [lineIndex] = cursorFromRowCol(document.lines, row, col);
			
			let hilite = document.lang.codeIntel.astSelection.hiliteFromLineIndex(document.lines, lineIndex);
			
			if (
				isPeeking
				&& hilite
				&& AstSelection.isWithin(hilite, selection)
				&& Selection.isFull(normalSelection)
			) {
				hilite = selection;
			}
			
			setSelectionHilite(hilite);
		} else {
			setSelectionHilite(null);
		}
		
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
		on(window, "dragend", dragend);
		
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
		
		requestAnimationFrame(function() {
			hilite(e);
		});
	}
	
	function mouseup() {
		editor.mouseup();
		
		dragging = false;
		
		off(window, "mousemove", drag);
		off(window, "mouseup", mouseup);
		off(window, "dragend", dragend);
	}
	
	function dragend() {
		mouseup();
	}

	return {
		mousedown,
		mousemove,
		hilite,
	};
}
