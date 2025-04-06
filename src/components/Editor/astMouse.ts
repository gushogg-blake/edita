import {on, off} from "utils/dom/domEvents";
import {AstSelection, a} from "core";
import {selectionUtils} from "modules/astIntel";
import autoScroll from "./utils/autoScroll";
import astDragData from "./astDragData";

export default function(editor, editorComponent) {
	let {document, view} = editor;
	let drag = null;
	let drawingSelection = false;
	let isDraggingOver = false;
	let mouseIsOver = false;
	let mouseIsDown = false;
	
	function getCanvasCoords(e) {
		let {canvasDiv} = editorComponent;
		
		let {
			x: left,
			y: top,
		} = canvasDiv.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		return [x, y];
	}
	
	function lineIndexFromEvent(e) {
		let [x, y] = getCanvasCoords(e);
		let [row, col] = view.canvasUtils.cursorRowColFromScreenCoords(x, y);
		
		if (row >= view.canvasUtils.countLineRowsFolded()) {
			return null;
		}
		
		return view.canvasUtils.cursorFromRowCol(row, col).lineIndex;
	}
	
	function hiliteFromLineIndex(lineIndex, pickOptionType=null, withinSelection=false) {
		if (pickOptionType) {
			withinSelection = true;
		}
		
		let {astSelection} = view;
		
		if (!withinSelection && astSelection.containsLineIndex(lineIndex)) {
			return astSelection;
		}
		
		return selectionUtils.hiliteFromLineIndex(document, lineIndex, pickOptionType);
	}
	
	function hiliteFromEvent(e, pickOptionType=null, withinSelection=false) {
		let lineIndex = lineIndexFromEvent(e);
		
		return lineIndex === null ? null : hiliteFromLineIndex(lineIndex, pickOptionType, withinSelection);
	}
	
	function getInsertionRange(e) {
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
	
	function hilite(e, pickOptionType) {
		let lineIndex = lineIndexFromEvent(e);
		
		if (lineIndex === null) {
			editor.astMouse.clearSelectionHilite();
			
			return;
		}
		
		let selection = hiliteFromLineIndex(lineIndex, pickOptionType);
		
		editor.astMouse.setSelectionHilite(selection, lineIndex, !pickOptionType);
	}
	
	function mousedown(e, pickOptionType, enableDrag) {
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
			
			enableDrag();
			
			editor.astMouse.setSelection(selection);
			
			on(window, "mouseup", mouseup);
			on(window, "dragend", dragend);
		}
	}
	
	function drawSelection(e) {
		
	}
	
	function finishSelection(e) {
		drawingSelection = false;
	}
	
	function mousemove(e, pickOptionType) {
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
	
	function mouseup(e) {
		mouseIsDown = false;
		
		editor.astMouse.setInsertionHilite(null);
		
		editorComponent.mouseup(e);
		
		off(window, "mousemove", drawSelection);
		off(window, "mouseup", mouseup);
		off(window, "mouseup", finishSelection);
		off(window, "dragend", dragend);
	}
	
	function mouseenter(e) {
		mouseIsOver = true;
	}
	
	function mouseleave(e) {
		editor.astMouse.clearSelectionHilite();
		
		mouseIsOver = false;
	}
	
	function click(e, pickOptionType) {
		if (e.button !== 0) {
			return;
		}
		
		let selection = hiliteFromEvent(e, pickOptionType, true);
		
		if (selection) {
			view.setAstSelection(selection);
		}
		
		hilite(e, pickOptionType);
	}
	
	function dblclick(e) {
		
	}
	
	function contextmenu(e, pickOptionType) {
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
	
	function middlepress(e, pickOptionType) {
		
	}
	
	function dragstart(e, pickOptionType) {
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
	
	function dragover(e, dropTargetType) {
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
	
	function dragenter(e) {
		isDraggingOver = true;
	}
	
	function dragleave(e) {
		isDraggingOver = false;
		
		view.clearDropTargets();
	}
	
	function drop(e, fromUs, toUs, extra) {
		// NOTE dropEffect doesn't work when dragging between windows
		// (it will always be none in the source window)
		
		let move = !e.ctrlKey;
		
		e.dataTransfer.dropEffect = move ? "move" : "copy";
		
		let {dropTargetType} = extra;
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
	
	function dragend() {
		view.clearDropTargets();
		
		mouseup();
		
		drag = null;
		isDraggingOver = false;
	}
	
	function updateHilites(e) {
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
		contextmenu,
		middlepress,
		dragstart,
		dragover,
		dragenter,
		dragleave,
		drop,
		dragend,
		updateHilites,
	};
}
