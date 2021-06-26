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
			selectionRegions,
			hasHorizontalScrollbar,
			scrollPosition,
			scrollBy,
			setSelection,
			addHistoryEntry,
			redraw,
			startCursorBlink,
		} = editor;
		
		let cursor = getCursor(e);
		
		let {
			x: left,
			y: top,
		} = canvas.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		if (e.button === 1) {
			setSelection(Selection.s(cursor));
			
			let str = await clipboard.readSelection();
			
			let {
				edit,
				newSelection,
			} = document.replaceSelection(editor.selection, str);
			
			applyAndAddHistoryEntry({
				edits: [edit],
				normalSelection: newSelection,
			});
			
			startCursorBlink();
			
			redraw();
			
			return;
		}
		
		if (pointIsWithinRegions(selectionRegions, x, y)) {
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
		} = editor;
		
		let cursor = getCursor(e);
		
		setSelection(Selection.s(cursor));
		
		startCursorBlink();
		
		redraw();
	}
	
	function dblclick(e) {
		
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
	
	function drop(e) {
		let {
			document,
			selection,
			setSelection,
			setInsertCursor,
			addHistoryEntry,
			redraw,
			startCursorBlink,
		} = editor;
		
		let str = e.dataTransfer.getData("text/plain");
		
		if (!str) {
			return;
		}
		
		let cursor = getCursor(e);
		
		let {
			lineIndex,
			removedLines,
			insertedLines,
			newSelection,
		} = document.replaceSelection(Selection.s(cursor), str);
		
		setSelection(newSelection);
		
		addHistoryEntry({
			undo() {
				document.edit(lineIndex, insertedLines.length, removedLines);
				setSelection(selection);
			},
			
			redo() {
				document.edit(lineIndex, removedLines.length, insertedLines);
				setSelection(newSelection);
			},
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
