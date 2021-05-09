import {on, off} from "../../utils/dom/domEvents";
import screenOffsets from "../../utils/dom/screenOffsets";
import autoScroll from "../../utils/dom/autoScroll";
import calculateMarginOffset from "../../modules/render/calculateMarginOffset";
import rowColFromScreenCoords from "../../modules/utils/rowColFromScreenCoords";
import rowColFromCursor from "../../modules/utils/rowColFromCursor";
import cursorFromRowCol from "../../modules/utils/cursorFromRowCol";

export default function(editor) {
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
