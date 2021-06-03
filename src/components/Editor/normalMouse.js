let {on, off} = require("../../utils/dom/domEvents");
let screenOffsets = require("../../utils/dom/screenOffsets");
let autoScroll = require("../../utils/dom/autoScroll");
let clipboard = require("../../modules/ipc/clipboard/renderer");
let calculateMarginOffset = require("../../modules/render/calculateMarginOffset");
let rowColFromScreenCoords = require("../../modules/utils/rowColFromScreenCoords");
let rowColFromCursor = require("../../modules/utils/rowColFromCursor");
let cursorFromRowCol = require("../../modules/utils/cursorFromRowCol");
let Selection = require("../../modules/utils/Selection");

module.exports = function(editor) {
	let dragging = false;
	
	async function mousedown(e) {
		if (e.button === 2) {
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
			insert,
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
		
		setSelection(Selection.s(cursor));
		
		if (e.button === 1) {
			let str = await clipboard.readSelection();
			let newSelection = document.replaceSelection(editor.selection, str);
			
			setSelection(newSelection);
		}
		
		let {end} = editor.selection;
		let [lineIndex, offset] = end;
		let [, endCol] = rowColFromCursor(document.lines, lineIndex, offset);
		
		setSelectionEndCol(endCol);
		
		startCursorBlink();
		
		redraw();
		
		if (e.button === 1) {
			return;
		}
		
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
	
	function mousemove(e) {
		if (dragging) {
			return;
		}
	}
	
	function mouseup() {
		let {
			document,
			selection,
		} = editor;
		
		if (Selection.isFull(selection)) {
			clipboard.writeSelection(document.getSelectedText(selection));
		}
		
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
	};
}
