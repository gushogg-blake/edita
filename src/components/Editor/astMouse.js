let parseJson = require("utils/parseJson");
let {on, off} = require("utils/dom/domEvents");
let AstSelection = require("modules/utils/AstSelection");
let astCommon = require("modules/langs/common/astMode");
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

module.exports = function(app, document, editor, view, editorComponent) {
	let drag = null;
	let drawingSelection = false;
	
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
	
	function getHilite(e, withinSelection=false) {
		let {
			astSelection,
			normalSelection,
		} = view;
		
		let {
			isPeekingAstMode: isPeeking,
		} = editorComponent;
		
		let [x, y] = getCanvasCoords(e);
		
		let [row, col] = view.cursorRowColFromScreenCoords(x, y);
		
		if (row >= view.countRows()) {
			return null;
		}
		
		let {lineIndex} = view.cursorFromRowCol(row, col);
		
		if (!withinSelection) {
			if (AstSelection.lineIsWithinSelection(lineIndex, astSelection)) {
				return astSelection;
			}
		}
		
		return astCommon.selection.hiliteFromLineIndex(document, lineIndex);
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
	
	function hilite(e) {
		let selection = getHilite(e);
		
		editor.astMouse.setSelectionHilite(selection);
	}
	
	function mousedown(e, option, enableDrag) {
		if (e.button === 0) {
			mousedownLeft(e, option, enableDrag);
		} else if (e.button === 1) {
			mousedownMiddle(e, option);
		} else if (e.button === 2) {
			mousedownRight(e, option);
		}
	}
	
	function mousedownLeft(e, option, enableDrag) {
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
			let selection = getHilite(e);
			
			if (!selection) {
				return;
			}
			
			enableDrag();
			
			editor.astMouse.setSelection(selection);
			
			on(window, "mouseup", mouseup);
			on(window, "dragend", dragend);
		}
		
		view.redraw();
	}
	
	function mousedownMiddle() {
		
	}
	
	function mousedownRight(e) {
		let selection = getHilite(e);
		
		if (!selection) {
			return;
		}
		
		editor.astMouse.setSelection(selection);
		
		let items = editor.getAvailableAstManipulations().map(function({code, name}) {
			return {
				label: name,
				
				onClick() {
					editor.doAstManipulation(code);
					
					view.redraw();
				},
			};
		});
		
		app.showContextMenu(e, items, true);
	}
	
	function drawSelection(e) {
		
	}
	
	function finishSelection(e) {
		drawingSelection = false;
	}
	
	function mousemove(e) {
		if (drawingSelection) {
			return;
		}
		
		requestAnimationFrame(function() {
			hilite(e);
		});
	}
	
	function mouseup(e) {
		editor.astMouse.setInsertionHilite(null);
		
		view.redraw();
		
		editorComponent.mouseup();
		
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
	
	function click(e) {
		if (e.button !== 0) {
			return;
		}
		
		let selection = getHilite(e, true);
		
		if (selection) {
			view.setAstSelection(selection);
		}
		
		hilite(e);
	}
	
	function dblclick(e) {
		
	}
	
	function optionhover(option, e) {
		//let {
		//	showDropTargetsFor,
		//} = editor;
		//
		//showDropTargetsFor(getHilite(e), option);
	}
	
	function dragstart(e, option) {
		let {
			astSelection: selection,
		} = view;
		
		let {startLineIndex, endLineIndex} = selection;
		let lines = AstSelection.linesToSelectionLines(document.lines.slice(startLineIndex, endLineIndex));
		
		drag = {
			selection,
			option,
			lines,
		};
		
		setData(e, {
			option,
			lines,
		});
	}
	
	function dragover(e, target) {
		e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
		
		let data = getData(e);
		
		if (!data) {
			return;
		}
		
		requestAnimationFrame(function() {
			let selection = getHilite(e);
			
			let {
				option,
			} = data;
			
			// TODO auto scroll at edges of code area
			
			view.showDropTargets();
			
			if (target) {
				editor.astMouse.setInsertionHilite(null);
			} else {
				editor.astMouse.setInsertionHilite(getInsertionRange(e));
			}
			
			view.redraw();
		});
	}
	
	function dragenter(e) {
		
	}
	
	function dragleave(e) {
		
	}
	
	function drop(e, fromUs, toUs, extra) {
		// NOTE dropEffect doesn't work when dragging between windows
		// (it will always be none in the source window)
		
		let move = !e.ctrlKey;
		
		e.dataTransfer.dropEffect = move ? "move" : "copy";
		
		let {target} = extra;
		let fromSelection;
		let toSelection;
		let lines;
		let option;
		let data = getData(e);
		
		if (toUs && !data) {
			editor.astMode.invalidDrop();
			
			return;
		}
		
		if (fromUs) {
			({
				selection: fromSelection,
				option,
				lines,
			} = drag);
		} else {
			fromSelection = null;
			
			({
				lines,
				option,
			} = data);
		}
		
		if (toUs) {
			toSelection = target ? getHilite(e) : getInsertionRange(e);
		} else {
			toSelection = null;
		}
		
		if (fromUs && toUs && AstSelection.equals(fromSelection, toSelection)) {
			return;
		}
		
		editor.astMouse.drop(
			fromSelection,
			toSelection,
			lines,
			move,
			option,
			target,
		);
		
		view.redraw();
	}
	
	function dragend() {
		view.clearDropTargets();
		
		mouseup();
		
		drag = null;
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
		optionhover,
		dragstart,
		dragover,
		dragenter,
		dragleave,
		drop,
		dragend,
		updateHilites,
	};
}
