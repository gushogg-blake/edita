let parseJson = require("utils/parseJson");
let {on, off} = require("utils/dom/domEvents");
let AstSelection = require("modules/utils/AstSelection");
let astCommon = require("modules/astCommon");
let autoScroll = require("./utils/autoScroll");

let {s} = AstSelection;

/*
you can't see the data (only the types) on dragover, and types can't contain
uppercase chars, so we encode all the data into a string of char codes.
*/

function setData(e, data) {
	let json = JSON.stringify({
		isAstDragDrop: true,
		data,
	});
	
	let str = json.split("").map(c => c.charCodeAt(0)).join(",");
	
	e.dataTransfer.setData(str, "");
}

function getData(e) {
	for (let encodedStr of e.dataTransfer.types) {
		try {
			let str = encodedStr.split(",").map(Number).map(n => String.fromCharCode(n)).join("");
			let json = parseJson(str);
			
			if (json && json.isAstDragDrop) {
				return json.data;
			}
		} catch (e) {}
	}
	
	return null;
}

module.exports = function(editor, editorComponent) {
	let {document, view} = editor;
	let drag = null;
	let drawingSelection = false;
	let isDraggingOver = false;
	
	function getCanvasCoords(e) {
		let {
			canvasDiv,
		} = editorComponent;
		
		let {
			x: left,
			y: top,
		} = canvasDiv.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		return [x, y];
	}
	
	function getHilite(e, pickOptionType=null, withinSelection=false) {
		if (pickOptionType) {
			withinSelection = true;
		}
		
		let {
			astSelection,
			normalSelection,
		} = view;
		
		let {
			isPeekingAstMode: isPeeking,
		} = editorComponent;
		
		let [x, y] = getCanvasCoords(e);
		
		let [row, col] = view.cursorRowColFromScreenCoords(x, y);
		
		if (row >= view.countLineRowsFolded()) {
			return null;
		}
		
		let {lineIndex} = view.cursorFromRowCol(row, col);
		
		if (!withinSelection && AstSelection.lineIsWithinSelection(lineIndex, astSelection)) {
			return astSelection;
		}
		
		return astCommon.selection.hiliteFromLineIndex(document, lineIndex, pickOptionType);
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
		} = view.insertLineIndexFromScreenY(y);
		
		let range = AstSelection.insertionRange(
			lines,
			aboveLineIndex,
			belowLineIndex,
			offset,
		);
		
		if (AstSelection.isWithin(range, astSelection)) {
			return s(astSelection.startLineIndex);
		}
		
		return range;
	}
	
	function hilite(e, pickOptionType) {
		let selection = getHilite(e, pickOptionType);
		
		editor.astMouse.setSelectionHilite(selection, !pickOptionType);
	}
	
	function mousedown(e, pickOptionType, enableDrag) {
		if (e.button === 0) {
			mousedownLeft(e, pickOptionType, enableDrag);
		} else if (e.button === 1) {
			mousedownMiddle(e, pickOptionType);
		} else if (e.button === 2) {
			mousedownRight(e, pickOptionType);
		}
	}
	
	function mousedownLeft(e, pickOptionType, enableDrag) {
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
			on(window, "mouseup", finishSelection);
		} else {
			let selection = getHilite(e, pickOptionType);
			
			if (!selection) {
				return;
			}
			
			enableDrag();
			
			editor.astMouse.setSelection(selection);
			
			on(window, "mouseup", mouseup);
			on(window, "dragend", dragend);
		}
	}
	
	function mousedownMiddle() {
		
	}
	
	function mousedownRight(e, pickOptionType) {
		let selection = getHilite(e, pickOptionType);
		
		if (!selection) {
			return;
		}
		
		editor.astMouse.setSelection(selection);
		
		let items = editor.getAvailableAstManipulations().map(function({code, name}) {
			return {
				label: name,
				
				onClick() {
					editor.doAstManipulation(code);
				},
			};
		});
		
		platform.showContextMenu(e, items, true);
	}
	
	function drawSelection(e) {
		
	}
	
	function finishSelection(e) {
		drawingSelection = false;
	}
	
	function mousemove(e, pickOptionType) {
		if (drawingSelection) {
			return;
		}
		
		requestAnimationFrame(function() {
			hilite(e, pickOptionType);
		});
	}
	
	function mouseup(e) {
		editor.astMouse.setInsertionHilite(null);
		
		editorComponent.mouseup(e);
		
		off(window, "mousemove", drawSelection);
		off(window, "mouseup", mouseup);
		off(window, "mouseup", finishSelection);
		off(window, "dragend", dragend);
	}
	
	function mouseenter() {
		
	}
	
	function mouseleave(e) {
		editor.astMouse.setSelectionHilite(null);
	}
	
	function click(e, pickOptionType) {
		if (e.button !== 0) {
			return;
		}
		
		let selection = getHilite(e, pickOptionType, true);
		
		if (selection) {
			view.setAstSelection(selection);
		}
		
		hilite(e);
	}
	
	function dblclick(e) {
		
	}
	
	function dragstart(e, pickOptionType) {
		let {
			astSelection: selection,
		} = view;
		
		let {startLineIndex, endLineIndex} = selection;
		let lines = AstSelection.linesToSelectionLines(document.lines.slice(startLineIndex, endLineIndex));
		
		drag = {
			selection,
			pickOptionType,
			lines,
		};
		
		setData(e, {
			pickOptionType,
			lines,
		});
	}
	
	function dragover(e, dropTargetType) {
		e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
		
		let data = getData(e);
		
		if (!data) {
			return;
		}
		
		isDraggingOver = true;
		
		requestAnimationFrame(function() {
			if (!isDraggingOver) {
				return;
			}
			
			let selection = getHilite(e);
			
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
		let data = getData(e);
		
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
			toSelection = dropTargetType ? getHilite(e) : getInsertionRange(e);
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
			editor.astMouse.setSelectionHilite(null);
		}
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
		updateHilites,
	};
}
