import {on, off} from "../../utils/dom/domEvents";
import screenOffsets from "../../utils/dom/screenOffsets";
import autoScroll from "../../utils/dom/autoScroll";
import calculateMarginOffset from "../../modules/render/calculateMarginOffset";
import rowColFromScreenCoords from "../../modules/utils/rowColFromScreenCoords";
import rowColFromCursor from "../../modules/utils/rowColFromCursor";
import cursorFromRowCol from "../../modules/utils/cursorFromRowCol";

export default function(e, editor) {
	let {
		canvas,
		measurements,
		document,
		hasHorizontalScrollbar,
		scrollBy,
		getScrollPosition,
		getSelection,
		setSelection,
		setSelectionEndCol,
		redraw,
		startCursorBlink,
	} = editor;
	
	function mousedown(e) {
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
			getScrollPosition(),
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
			
			if (!hasHorizontalScrollbar()) {
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
			x: left,
			y: top,
		} = canvas.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		let [row, col] = rowColFromScreenCoords(
			document.lines,
			x,
			y,
			getScrollPosition(),
			measurements,
		);
		
		let cursor = cursorFromRowCol(
			document.lines,
			row,
			col,
		);
		
		setSelection({
			...getSelection(),
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
	
	mousedown(e);
}
