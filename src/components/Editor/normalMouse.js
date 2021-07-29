let {on, off} = require("../../utils/dom/domEvents");
let Selection = require("./utils/Selection");
let rowColFromCursor = require("./utils/rowColFromCursor");
let cursorFromRowCol = require("./utils/cursorFromRowCol");
let autoScroll = require("./utils/dom/autoScroll");
let rowColFromScreenCoords = require("./canvas/utils/rowColFromScreenCoords");
let cursorRowColFromScreenCoords = require("./canvas/utils/cursorRowColFromScreenCoords");
//let pointIsWithinRegions = require("./canvas/utils/pointIsWithinRegions");

module.exports = function(editor) {
	let drawingSelection = false;
	
	/*
	get insert cursor from mouse event (the cursor either side of the clicked
	char, depending on position within the char)
	*/
	
	function getCursor(e) {
		let {
			canvas,
			measurements,
			document,
			scrollPosition,
		} = editor;
		
		let {
			x: left,
			y: top,
		} = canvas.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		let [row, col] = cursorRowColFromScreenCoords(
			document.lines,
			x,
			y,
			scrollPosition,
			measurements,
		);
		
		return cursorFromRowCol(
			document.lines,
			row,
			col,
		);
	}
	
	/*
	get char cursor (the cursor before the clicked char)
	*/
	
	function getCharCursor(e) {
		let {
			canvas,
			measurements,
			document,
			scrollPosition,
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
		
		return cursorFromRowCol(
			document.lines,
			row,
			col,
			true,
		);
	}
	
	async function mousedown(e, enableDrag) {
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
			applyAndAddHistoryEntry,
			redraw,
			startCursorBlink,
		} = editor;
		
		let cursor = getCursor(e);
		let charCursor = getCharCursor(e);
		
		let {
			x: left,
			y: top,
		} = canvas.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		if (e.button === 1) {
			let str = await platform.clipboard.readSelection();
			
			let {
				edit,
				newSelection,
			} = document.replaceSelection(Selection.s(cursor), str);
			
			applyAndAddHistoryEntry({
				edits: [edit],
				normalSelection: newSelection,
			});
			
			startCursorBlink();
			
			redraw();
			
			return;
		}
		
		autoScroll(
			canvas,
			measurements,
			document,
			hasHorizontalScrollbar,
			scrollBy,
		);
		
		if (Selection.charIsWithinSelection(selection, charCursor)) {
			if (e.button === 0) {
				mousedownInSelection(e, enableDrag);
			}
			
			return;
		}
		
		setSelection(Selection.s(cursor));
		
		startCursorBlink();
		
		redraw();
		
		drawingSelection = true;
		
		on(window, "mousemove", drawSelection);
		on(window, "mouseup", mouseup);
		on(window, "dragend", dragend);
	}
	
	function mousedownInSelection(e, enableDrag) {
		if (e.button === 0) {
			enableDrag();
		}
	}
	
	function drawSelection(e) {
		let {
			selection,
			setSelection,
			redraw,
		} = editor;
		
		let cursor = getCursor(e);
		
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
			platform.clipboard.writeSelection(document.getSelectedText(selection));
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
		} = editor;
		
		let cursor = getCursor(e);
		
		setSelection(Selection.s(cursor));
		
		startCursorBlink();
		
		redraw();
	}
	
	function dblclick(e) {
		let {
			document,
			setSelection,
			redraw,
			startCursorBlink,
		} = editor;
		
		let cursor = getCharCursor(e);
		
		setSelection(Selection.wordUnderCursor(document.lines, cursor));
		
		startCursorBlink();
		
		redraw();
	}
	
	function dragstart(e) {
		let {
			document,
			selection,
		} = editor;
		
		e.dataTransfer.setData("text/plain", document.getSelectedText(selection));
	}
	
	function dragover(e) {
		let {
			setInsertCursor,
			redraw,
		} = editor;
		
		if (!e.dataTransfer.types.includes("text/plain")) {
			return;
		}
		
		let cursor = getCursor(e);
		
		setInsertCursor(cursor);
		
		redraw();
	}
	
	function dragenter(e) {
		
	}
	
	function dragleave(e) {
		let {
			setInsertCursor,
			redraw,
		} = editor;
		
		setInsertCursor(null);
		
		redraw();
	}
	
	function drop(e, fromUs, toUs, extra) {
		let {
			document,
			selection,
			setInsertCursor,
			applyAndAddHistoryEntry,
			redraw,
			startCursorBlink,
		} = editor;
		
		if (!e.dataTransfer.types.includes("text/plain")) {
			return;
		}
		
		let str = e.dataTransfer.getData("text/plain");
		
		if (!str) {
			return;
		}
		
		let move = !e.ctrlKey;
		
		e.dataTransfer.dropEffect = move ? "move" : "copy";
		
		let cursor = getCursor(e);
		let isWithinSelection = Selection.cursorIsWithinSelection(selection, cursor);
		
		if (move) {
			if (Selection.cursorIsWithinOrNextToSelection(selection, cursor)) {
				return;
			}
		} else {
			if (Selection.cursorIsWithinSelection(selection, cursor)) {
				return;
			}
		}
		
		let edits;
		let newSelection;
		
		if (move && fromUs) {
			({
				edits,
				newSelection,
			} = document.move(selection, cursor));
		} else {
			({
				edits,
				newSelection,
			} = document.replaceSelection(Selection.s(cursor), str));
		}
		
		applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
		});
		
		setInsertCursor(null);
		
		startCursorBlink();
		
		redraw();
	}
	
	function dragend() {
		let {
			setInsertCursor,
			redraw,
		} = editor;
		
		setInsertCursor(null);
		
		redraw();
		
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
