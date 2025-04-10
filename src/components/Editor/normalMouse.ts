import {on, off} from "utils/dom/domEvents";
import {Selection, s} from "core";
import type {CustomMouseEvent, CustomMousedownEvent, CustomDragEvent} from "./mouseEvents";
import autoScroll from "./utils/autoScroll";
import {getCursor, getCharCursor} from "./utils/cursorFromEvent";

export default function(editor, editorComponent) {
	let {document, view} = editor;
	let drawingSelection = false;
	let origDoubleClickWordSelection = false;
	
	function mousedown({originalEvent: e, isDoubleClick, enableDrag}: CustomMousedownEvent) {
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
		
		on(window, "mousemove", drawSelectionRAF);
		on(window, "mouseup", mouseup);
		on(window, "dragend", dragend);
	}
	
	function drawSelection(e: MouseEvent) {
		let cursor = getCursor(e, view, editorComponent.canvasDiv);
		
		if (origDoubleClickWordSelection) {
			editor.normalMouse.drawDoubleClickSelection(origDoubleClickWordSelection, cursor);
		} else {
			editor.normalMouse.drawSelection({
				start: view.normalSelection.start,
				end: cursor,
			});
		}
	}
	
	let drawSelectionAnimationId = null;
	
	function drawSelectionRAF(e: MouseEvent) {
		if (drawSelectionAnimationId !== null) {
			cancelAnimationFrame(drawSelectionAnimationId);
		}
		
		drawSelectionAnimationId = requestAnimationFrame(function() {
			drawSelection(e);
		});
	}
	
	function mousemove({originalEvent: e}: CustomMouseEvent) {
		if (drawingSelection) {
			return;
		}
	}
	
	function mouseup(e: MouseEvent) {
		if (drawingSelection) {
			if (drawSelectionAnimationId) {
				cancelAnimationFrame(drawSelectionAnimationId);
			}
			
			drawSelection(e); // do a non-RAF one to make sure it's up to date
			
			// NOTE this is a bit weird - we update the view while drawing,
			// and only update the Editor afterwards, so they'll be out of
			// sync while drawing. probs doesn't matter, just worth noting
			editor.normalMouse.finishDrawingSelection();
		}
		
		editorComponent.mouseup(e);
		
		drawingSelection = false;
		origDoubleClickWordSelection = null;
		
		off(window, "mousemove", drawSelectionRAF);
		off(window, "mouseup", mouseup);
		off(window, "dragend", dragend);
	}
	
	function mouseenter({originalEvent: e}: CustomMouseEvent) {
		
	}
	
	function mouseleave({originalEvent: e}: CustomMouseEvent) {
		
	}
	
	function click({originalEvent: e}: CustomMouseEvent) {
		let cursor = getCursor(e, view, editorComponent.canvasDiv);
		
		if (e.ctrlKey) {
			editor.goToDefinitionFromCursor(cursor);
			
			return;
		}
		
		editor.normalMouse.setSelectionAndStartCursorBlink(s(cursor));
	}
	
	function dblclick({originalEvent: e}: CustomMouseEvent) {
		let cursor = getCharCursor(e, view, editorComponent.canvasDiv);
		
		origDoubleClickWordSelection = view.Selection.wordUnderCursor(cursor);
		
		editor.normalMouse.setSelectionAndStartCursorBlink(origDoubleClickWordSelection);
		
		if (view.normalSelection.isFull()) {
			platform.clipboard.writeSelection(editor.getSelectedText());
		}
	}
	
	function middlepress({originalEvent: e}: CustomMouseEvent) {
		let cursor = getCursor(e, view, editorComponent.canvasDiv);
		
		editor.normalMouse.insertSelectionClipboard(cursor);
	}
	
	function contextmenu({originalEvent: e}: CustomMouseEvent) {
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
	
	function dragstart({originalEvent: e}: CustomDragEvent) {
		let {
			normalSelection: selection,
		} = view;
		
		e.dataTransfer.setData("text/plain", document.getSelectedText(selection));
	}
	
	function dragover({originalEvent: e}: CustomDragEvent) {
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
	
	function dragenter({originalEvent: e}: CustomDragEvent) {
		
	}
	
	function dragleave({originalEvent: e}: CustomDragEvent) {
		view.setInsertCursor(null);
	}
	
	function drop({originalEvent: e, fromUs, toUs}: CustomDragEvent) {
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
	
	function dragend({originalEvent: e}: CustomDragEvent) {
		view.setInsertCursor(null);
		
		mouseup(e);
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
		updateHilites(e: MouseEvent) {}, // AST only
	};
}
