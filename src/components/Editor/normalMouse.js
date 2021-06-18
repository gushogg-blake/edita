let {on, off} = require("../../utils/dom/domEvents");
let clipboard = require("../../modules/ipc/clipboard/renderer");
let rowColFromScreenCoords = require("../../modules/utils/rowColFromScreenCoords");
let rowColFromCursor = require("../../modules/utils/rowColFromCursor");
let cursorFromRowCol = require("../../modules/utils/cursorFromRowCol");
let Selection = require("../../modules/utils/Selection");
let pointIsWithinRegions = require("../../modules/utils/pointIsWithinRegions");
let autoScroll = require("./utils/autoScroll");

module.exports = function(editor) {
	let drawingSelection = false;
	
	async function mousedown(e, enableDrag) {
		if (e.button === 2) {
			return;
		}
		
		let {
			canvas,
			measurements,
			document,
			selectionRegions,
			hasHorizontalScrollbar,
			scrollPosition,
			scrollBy,
			setSelection,
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
		
		if (pointIsWithinRegions(selectionRegions, x, y)) {
			if (e.button === 1) {
				setSelection(Selection.s(cursor));
				
				let str = await clipboard.readSelection();
				let newSelection = document.replaceSelection(editor.selection, str);
				
				setSelection(newSelection);
				
				startCursorBlink();
				
				redraw();
			}
			
			if (e.button === 0) {
				mousedownInSelection(e, enableDrag);
			}
			
			return;
		}
		
		setSelection(Selection.s(cursor));
		
		startCursorBlink();
		
		redraw();
		
		if (e.button === 1) {
			return;
		}
		
		drawingSelection = true;
		
		on(window, "mousemove", drawSelection);
		on(window, "mouseup", mouseup);
		on(window, "dragend", dragend);
		
		autoScroll(
			canvas,
			measurements,
			document,
			hasHorizontalScrollbar,
			scrollBy,
		);
	}
	
	function mousedownInSelection(e, enableDrag) {
		if (e.button === 0) {
			enableDrag();
		}
	}
	
	function drawSelection(e) {
		let {
			canvas,
			measurements,
			document,
			selection,
			scrollPosition,
			setSelection,
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
		
		redraw();
	}
	
	function mousemove(e) {
		if (drawingSelection) {
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
		
		drawingSelection = false;
		
		
		off(window, "mousemove", drawSelection);
		off(window, "mouseup", mouseup);
		off(window, "dragend", dragend);
	}
	
	function mouseenter() {
		
	}
	
	function mouseleave(e) {
		
	}
	
	async function click(e) {
		if (e.button !== 0) {
			return;
		}
		
		let {
			canvas,
			measurements,
			document,
			selection,
			scrollPosition,
			setSelection,
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
		
		startCursorBlink();
		
		redraw();
	}
	
	function dblclick(e) {
		
	}
	
	function dragstart(e) {
		
	}
	
	function dragover(e) {
		
	}
	
	function dragenter(e) {
		
	}
	
	function dragleave(e) {
		
	}
	
	function drop(e) {
		let str = e.dataTransfer.getData("text/plain");
		
		console.log(str);
	}
	
	function dragend() {
		mouseup();
	}
	
	return {
		mousedown,
		mousemove,
		mouseenter,
		mouseleave,
		click,
		dblclick,
		dragstart,
		dragover,
		dragenter,
		dragleave,
		drop,
		dragend,
	};
}
