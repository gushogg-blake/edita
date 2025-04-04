import {on, off} from "utils/dom/domEvents";
import Selection, {s} from "core/Selection";
import autoScroll from "./utils/autoScroll";
import {getCursor, getCharCursor} from "./utils/cursorFromEvent";

export default function(editor, editorComponent) {
	let {document, view} = editor;
	let drawingSelection = false;
	let origDoubleClickWordSelection = false;
	
	function mousedown(e, isDoubleClick, enableDrag) {
		if (e.ctrlKey) {
			return;
		}
		
		let {
			canvasDiv,
			showingHorizontalScrollbar,
		} = editorComponent;
		
		let cursor = getCursor(e, view, canvasDiv);
		let charCursor = getCharCursor(e, view, canvasDiv);
		
		autoScroll(
			canvasDiv,
			view,
			showingHorizontalScrollbar,
		);
		
		if (!isDoubleClick) {
			if (view.normalSelection.containsCharCursor(charCursor)) {
				enableDrag();
				
				return;
			}
			
			editor.normalMouse.setSelectionAndStartCursorBlink(s(cursor));
		}
		
		drawingSelection = true;
		
		on(window, "mousemove", drawSelection);
		on(window, "mouseup", mouseup);
		on(window, "dragend", dragend);
	}
	
	function drawSelection(e) {
		requestAnimationFrame(function() {
			let cursor = getCursor(e, view, editorComponent.canvasDiv);
			
			if (origDoubleClickWordSelection) {
				editor.normalMouse.drawDoubleClickSelection(origDoubleClickWordSelection, cursor);
			} else {
				editor.normalMouse.drawSelection({
					start: view.normalSelection.start,
					end: cursor,
				});
			}
		});
	}
	
	function mousemove(e) {
		if (drawingSelection) {
			return;
		}
	}
	
	function mouseup(e) {
		if (view.normalSelection.isFull()) {
			editor.normalMouse.finishDrawingSelection();
		} else {
			editor.normalMouse.updateAstSelection();
		}
		
		editorComponent.mouseup(e);
		
		drawingSelection = false;
		origDoubleClickWordSelection = null;
		
		off(window, "mousemove", drawSelection);
		off(window, "mouseup", mouseup);
		off(window, "dragend", dragend);
	}
	
	function mouseenter() {
		
	}
	
	function mouseleave(e) {
		
	}
	
	function click(e) {
		let cursor = getCursor(e, view, editorComponent.canvasDiv);
		
		if (e.ctrlKey) {
			editor.goToDefinitionFromCursor(cursor);
			
			return;
		}
		
		editor.normalMouse.setSelectionAndStartCursorBlink(s(cursor));
	}
	
	function dblclick(e) {
		let cursor = getCharCursor(e, view, editorComponent.canvasDiv);
		
		origDoubleClickWordSelection = view.Selection.wordUnderCursor(cursor);
		
		editor.normalMouse.setSelectionAndStartCursorBlink(origDoubleClickWordSelection);
		
		if (view.normalSelection.isFull()) {
			platform.clipboard.writeSelection(editor.getSelectedText());
		}
	}
	
	function middlepress(e) {
		let cursor = getCursor(e, view, editorComponent.canvasDiv);
		
		editor.normalMouse.insertSelectionClipboard(cursor);
	}
	
	function contextmenu(e) {
		let cursor = getCursor(e, view, editorComponent.canvasDiv);
		
		let items = [
			{
				label: "Go to definition",
				
				onClick() {
					editor.goToDefinitionFromCursor(cursor);
				},
			},
			{
				label: "Find references",
				
				onClick() {
					editor.findReferencesFromCursor(cursor);
				},
			},
		];
		
		platform.showContextMenu(e, editorComponent.app, items);
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
		
		let cursor = getCursor(e, view, editorComponent.canvasDiv);
		
		let {historyIndex} = document;
		
		requestAnimationFrame(function() {
			/*
			the document might have been edited between requesting
			this frame and it being scheduled, in which case the cursor
			might be invalid. this will usually happen at the end of a
			drag and drop (key events don't get through while we're
			dragging, so the only other case I can think of is an auto-
			update from the file being modified by another program).
			since in the drag and drop case we'll be cancelling the insert
			cursor anyway, we can safely ignore this case (and we should -
			this change fixes a bug where the normal cursor renderer was
			getting into an infinite loop due to it being off the end of
			the line).
			*/
			
			if (historyIndex !== document.historyIndex) {
				return;
			}
			
			view.setInsertCursor(cursor);
		});
	}
	
	function dragenter(e) {
		
	}
	
	function dragleave(e) {
		view.setInsertCursor(null);
	}
	
	function drop(e, fromUs, toUs, extra) {
		if (!e.dataTransfer.types.includes("text/plain")) {
			return;
		}
		
		let str = e.dataTransfer.getData("text/plain");
		
		if (!str) {
			return;
		}
		
		let cursor = getCursor(e, view, editorComponent.canvasDiv);
		let move = !e.ctrlKey;
		
		e.dataTransfer.dropEffect = move ? "move" : "copy";
		
		editor.normalMouse.drop(cursor, str, move, fromUs, toUs);
	}
	
	function dragend() {
		view.setInsertCursor(null);
		
		mouseup();
	}
	
	return {
		mousedown,
		mousemove,
		mouseenter,
		mouseleave,
		click,
		dblclick,
		middlepress,
		contextmenu,
		dragstart,
		dragover,
		dragenter,
		dragleave,
		drop,
		dragend,
	};
}
