import {on, off} from "utils/dom/domEvents";
import {AstSelection, a} from "core";
import type {PickOptionType} from "core/astMode";
import {astSelectionUtils} from "modules/astIntel";
import type {CustomMouseEvent, CustomMousedownEvent, CustomDragEvent} from "./mouseEvents";
import {astDragData} from "./mouseEvents";
import autoScroll from "./utils/autoScroll";

export default function(editor, editorComponent) {
	let {document, view, modeSwitchKey} = editor;
	let drag = null;
	let drawingSelection = false;
	let isDraggingOver = false;
	let mouseIsOver = false;
	let mouseIsDown = false;
	
	function getCanvasCoords(e: MouseEvent) {
		let {canvasDiv} = editorComponent;
		
		let {
			x: left,
			y: top,
		} = canvasDiv.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		return [x, y];
	}
	
	function lineIndexFromEvent(e: MouseEvent) {
		let [x, y] = getCanvasCoords(e);
		let [row, col] = view.canvasUtils.cursorRowColFromScreenCoords(x, y);
		
		if (row >= view.canvasUtils.countLineRowsFolded()) {
			return null;
		}
		
		return view.canvasUtils.cursorFromRowCol(row, col).lineIndex;
	}
	
	function hiliteFromLineIndex(
		lineIndex: number,
		pickOptionType: PickOptionType = null,
		withinSelection = false,
	) {
		if (pickOptionType) {
			withinSelection = true;
		}
		
		let {astSelection} = view;
		
		if (!withinSelection && astSelection.containsLineIndex(lineIndex)) {
			return astSelection;
		}
		
		return astSelectionUtils.hiliteFromLineIndex(document, lineIndex, pickOptionType);
	}
	
	function hiliteFromEvent(
		e: MouseEvent,
		pickOptionType: PickOptionType = null,
		withinSelection = false,
	) {
		let lineIndex = lineIndexFromEvent(e);
		
		return lineIndex === null ? null : hiliteFromLineIndex(lineIndex, pickOptionType, withinSelection);
	}
	
	function getInsertionRange(e: MouseEvent) {
		let {
			astSelection,
		} = view;
		
		let {lines} = document;
		let [x, y] = getCanvasCoords(e);
		
		let {
			aboveLineIndex,
			belowLineIndex,
			offset,
		} = view.canvasUtils.insertLineIndexFromScreenY(y);
		
		let range = AstSelection.insertionRange(
			lines,
			aboveLineIndex,
			belowLineIndex,
			offset,
		);
		
		if (range.isWithin(astSelection)) {
			return a(astSelection.startLineIndex);
		}
		
		return range;
	}
	
	function hilite(e: MouseEvent, pickOptionType?: PickOptionType) {
		let lineIndex = lineIndexFromEvent(e);
		
		if (lineIndex === null) {
			editor.astMouse.clearSelectionHilite();
			
			return;
		}
		
		let selection = hiliteFromLineIndex(lineIndex, pickOptionType);
		
		editor.astMouse.setSelectionHilite(selection, lineIndex, !pickOptionType);
	}
	
	function mousedown({originalEvent: e, pickOptionType, enableDrag}: CustomMousedownEvent) {
		mouseIsDown = true;
		
		let {
			canvasDiv,
			showingHorizontalScrollbar,
		} = editorComponent;
		
		autoScroll(
			canvasDiv,
			view,
			showingHorizontalScrollbar,
		);
		
		if (e.shiftKey) {
			drawingSelection = true;
			
			on(window, "mousemove", drawSelection);
			on(window, "mouseup", mouseup);
			on(window, "mouseup", finishSelection);
		} else {
			let selection = hiliteFromEvent(e, pickOptionType);
			
			if (!selection) {
				return;
			}
			
			enableDrag(
				// if we're holding Escape and haven't pressed another key,
				// it'll cancel a native drag, so use a synthetic one
				modeSwitchKey.isPeeking
				&& !modeSwitchKey.keyPressedWhilePeeking
				&& base.prefs.modeSwitchKey === "Escape"
			);
			
			editor.astMouse.setSelection(selection);
			
			on(window, "mouseup", mouseup);
			on(window, "dragend", dragend);
		}
	}
	
	function drawSelection(e: MouseEvent) {
		
	}
	
	function finishSelection(e: MouseEvent) {
		drawingSelection = false;
	}
	
	function mousemove({originalEvent: e, pickOptionType}: CustomMouseEvent) {
		mouseIsOver = true;
		
		if (drawingSelection || mouseIsDown) {
			return;
		}
		
		requestAnimationFrame(function() {
			if (!mouseIsOver) {
				return;
			}
			
			hilite(e, pickOptionType);
		});
	}
	
	function mouseup(e: MouseEvent) {
		mouseIsDown = false;
		
		editor.astMouse.setInsertionHilite(null);
		
		editorComponent.mouseup(e);
		
		off(window, "mousemove", drawSelection);
		off(window, "mouseup", mouseup);
		off(window, "mouseup", finishSelection);
		off(window, "dragend", dragend);
	}
	
	function mouseenter({originalEvent: e}: CustomMouseEvent) {
		mouseIsOver = true;
	}
	
	function mouseleave({originalEvent: e}: CustomMouseEvent) {
		editor.astMouse.clearSelectionHilite();
		
		mouseIsOver = false;
	}
	
	function click({originalEvent: e, pickOptionType}: CustomMouseEvent) {
		if (e.button !== 0) {
			return;
		}
		
		let selection = hiliteFromEvent(e, pickOptionType, true);
		
		if (selection) {
			view.setAstSelection(selection);
		}
		
		hilite(e, pickOptionType);
	}
	
	function dblclick({originalEvent: e}: CustomMouseEvent) {
		
	}
	
	function contextmenu({originalEvent: e, pickOptionType}: CustomMouseEvent) {
		let selection = hiliteFromEvent(e, pickOptionType);
		
		if (!selection) {
			return;
		}
		
		editor.astMouse.setSelection(selection);
		
		let items = editor.astMode.getAvailableAstManipulations().map(function({code, name}) {
			return {
				label: name,
				
				onClick() {
					editor.astMode.doAstManipulation(code);
				},
			};
		});
		
		platform.showContextMenu(e, editorComponent.app, items, {
			noCancel: true,
		});
	}
	
	function middlepress({originalEvent: e, pickOptionType}: CustomMouseEvent) {
		
	}
	
	function dragstart({originalEvent: e, pickOptionType}: CustomDragEvent) {
		let {
			astSelection: selection,
		} = view;
		
		let {startLineIndex, endLineIndex} = selection;
		let lines = AstSelection.linesToSelectionContents(document.lines.slice(startLineIndex, endLineIndex));
		
		drag = {
			selection,
			pickOptionType,
			lines,
		};
		
		astDragData.set(e, {
			pickOptionType,
			lines,
		});
	}
	
	function dragover({originalEvent: e, dropTargetType}: CustomDragEvent) {
		e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
		
		let data = astDragData.get(e);
		
		if (!data) {
			return;
		}
		
		isDraggingOver = true;
		
		requestAnimationFrame(function() {
			if (!isDraggingOver) {
				return;
			}
			
			// TODO auto scroll at edges of code area
			
			view.showDropTargets();
			
			if (dropTargetType) {
				editor.astMouse.setInsertionHilite(null);
			} else {
				editor.astMouse.setInsertionHilite(getInsertionRange(e));
			}
		});
	}
	
	function dragenter({originalEvent: e}: CustomDragEvent) {
		isDraggingOver = true;
	}
	
	function dragleave({originalEvent: e}: CustomDragEvent) {
		isDraggingOver = false;
		
		view.clearDropTargets();
	}
	
	function drop({originalEvent: e, fromUs, toUs, dropTargetType}: CustomDragEvent) {
		// NOTE dropEffect doesn't work when dragging between windows
		// (it will always be none in the source window)
		
		let move = !e.ctrlKey;
		
		e.dataTransfer.dropEffect = move ? "move" : "copy";
		
		let fromSelection;
		let toSelection;
		let lines;
		let pickOptionType;
		let data = astDragData.get(e);
		
		if (toUs && !data) {
			editor.astMode.invalidDrop();
			
			return;
		}
		
		if (fromUs) {
			({
				selection: fromSelection,
				pickOptionType,
				lines,
			} = drag);
		} else {
			fromSelection = null;
			
			({
				lines,
				pickOptionType,
			} = data);
		}
		
		if (toUs) {
			let lineIndex = lineIndexFromEvent(e);
			let line = document.lines[lineIndex];
			
			toSelection = (
				dropTargetType
				? line?.trimmed ? hiliteFromLineIndex(lineIndex) : getInsertionRange(e)
				: getInsertionRange(e)
			);
		} else {
			toSelection = null;
		}
		
		editor.astMouse.drop(
			fromSelection,
			toSelection,
			lines,
			move,
			pickOptionType,
			dropTargetType,
		);
	}
	
	function dragend({originalEvent: e}: CustomDragEvent) {
		view.clearDropTargets();
		
		mouseup(e);
		
		drag = null;
		isDraggingOver = false;
	}
	
	function updateHilites(e: MouseEvent) {
		if (e) {
			hilite(e);
		} else {
			editor.astMouse.clearSelectionHilite();
		}
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
		updateHilites,
	};
}
