let {on, off} = require("../../utils/dom/domEvents");
let Selection = require("../../modules/utils/Selection");
let autoScroll = require("./utils/autoScroll");

module.exports = function(document, editor, view, editorComponent) {
	let drawingSelection = false;
	
	/*
	get insert cursor from mouse event (the cursor either side of the clicked
	char, depending on position within the char)
	*/
	
	function getCursor(e) {
		let {
			canvasDiv,
		} = editorComponent;
		
		let {
			x: left,
			y: top,
		} = canvasDiv.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		let [row, col] = view.cursorRowColFromScreenCoords(x, y);
		
		return view.cursorFromRowCol(row, col);
	}
	
	/*
	get char cursor (the cursor before the clicked char)
	*/
	
	function getCharCursor(e) {
		let {
			canvasDiv,
		} = editorComponent;
		
		let {
			x: left,
			y: top,
		} = canvasDiv.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		let [row, col] = view.rowColFromScreenCoords(x, y);
		
		return view.cursorFromRowCol(row, col, true);
	}
	
	async function mousedown(e, enableDrag) {
		if (e.button === 2) {
			return;
		}
		
		let {
			canvasDiv,
			showingHorizontalScrollbar,
		} = editorComponent;
		
		let cursor = getCursor(e);
		let charCursor = getCharCursor(e);
		
		let {
			x: left,
			y: top,
		} = canvasDiv.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		if (e.button === 1) {
			let str = await platform.clipboard.readSelection();
			
			let {
				edit,
				newSelection,
			} = document.replaceSelection(Selection.s(cursor), str);
			
			editor.applyAndAddHistoryEntry({
				edits: [edit],
				normalSelection: newSelection,
			});
			
			view.startCursorBlink();
			view.redraw();
			
			return;
		}
		
		autoScroll(
			canvasDiv,
			view,
			showingHorizontalScrollbar,
		);
		
		if (Selection.charIsWithinSelection(view.normalSelection, charCursor)) {
			if (e.button === 0) {
				mousedownInSelection(e, enableDrag);
			}
			
			return;
		}
		
		editor.normalMouse.setSelection(Selection.s(cursor));
		
		view.startCursorBlink();
		view.redraw();
		
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
		let cursor = getCursor(e);
		
		editor.normalMouse.setSelection({
			start: view.normalSelection.start,
			end: cursor,
		});
		
		view.redraw();
	}
	
	function mousemove(e) {
		if (drawingSelection) {
			return;
		}
	}
	
	function mouseup() {
		if (view.Selection.isFull()) {
			platform.clipboard.writeSelection(editor.getSelectedText());
		}
		
		editorComponent.mouseup();
		
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
		
		let cursor = getCursor(e);
		
		editor.normalMouse.setSelection(Selection.s(cursor));
		
		view.startCursorBlink();
		view.redraw();
	}
	
	function dblclick(e) {
		let cursor = getCharCursor(e);
		
		editor.normalMouse.setSelection(view.Selection.wordUnderCursor(cursor));
		
		view.startCursorBlink();
		view.redraw();
	}
	
	function dragstart(e) {
		let {
			normalSelection: selection,
		} = view;
		
		e.dataTransfer.setData("text/plain", document.getSelectedText(selection));
	}
	
	function dragover(e) {
		if (!e.dataTransfer.types.includes("text/plain")) {
			return;
		}
		
		let cursor = getCursor(e);
		
		view.insertCursor = cursor;
		view.redraw();
	}
	
	function dragenter(e) {
		
	}
	
	function dragleave(e) {
		view.insertCursor = null;
		view.redraw();
	}
	
	function drop(e, fromUs, toUs, extra) {
		let {
			normalSelection: selection,
		} = view;
		
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
		
		if (move && fromUs) {
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
			let edit = document.replaceSelection(Selection.s(cursor), str);
			
			edits = [edit.edit];
			newSelection = document.getSelectionContainingString(cursor, str);
		}
		
		editor.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
		});
		
		view.insertCursor = null;
		view.startCursorBlink();
		view.redraw();
	}
	
	function dragend() {
		view.insertCursor = null;
		view.redraw();
		
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
