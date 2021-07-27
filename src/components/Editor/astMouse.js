let parseJson = require("../../utils/parseJson");
let {on, off} = require("../../utils/dom/domEvents");
let autoScroll = require("./utils/dom/autoScroll");
let insertLineIndexFromScreenY = require("./canvas/utils/insertLineIndexFromScreenY");
let rowColFromScreenCoords = require("./canvas/utils/rowColFromScreenCoords");
let rowColFromCursor = require("./utils/rowColFromCursor");
let cursorFromRowCol = require("./utils/cursorFromRowCol");
let AstSelection = require("./utils/AstSelection");
let Selection = require("./utils/Selection");

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

module.exports = function(editor) {
	let drag = null;
	let drawingSelection = false;
	
	function getCanvasCoords(e) {
		let {
			canvas,
		} = editor;
		
		let {
			x: left,
			y: top,
		} = canvas.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		return [x, y];
	}
	
	function getHilite(e, withinSelection=false) {
		let {
			measurements,
			document,
			selection,
			isPeekingAstMode: isPeeking,
			normalSelection,
			scrollPosition,
		} = editor;
		
		let [x, y] = getCanvasCoords(e);
		
		let [row, col] = rowColFromScreenCoords(
			document.lines,
			x,
			y,
			scrollPosition,
			measurements,
		);
		
		if (row >= document.countRows()) {
			return null;
		}
		
		let [lineIndex] = cursorFromRowCol(document.lines, row, col);
		
		if (!withinSelection) {
			if (
				(!isPeeking || Selection.isFull(normalSelection))
				&& AstSelection.lineIsWithinSelection(lineIndex, selection)
			) {
				return selection;
			}
		}
		
		return document.lang.codeIntel.astSelection.hiliteFromLineIndex(document.lines, lineIndex);
	}
	
	function getInsertionRange(e) {
		let {
			document,
			selection,
			scrollPosition,
			measurements,
		} = editor;
		
		let {lines} = document;
		let [x, y] = getCanvasCoords(e);
		
		let {
			aboveLineIndex,
			belowLineIndex,
			offset,
		} = insertLineIndexFromScreenY(
			lines,
			y,
			scrollPosition,
			measurements,
		);
		
		let range = AstSelection.insertionRange(
			lines,
			aboveLineIndex,
			belowLineIndex,
			offset,
		);
		
		if (AstSelection.isWithin(range, selection)) {
			let [startLineIndex] = selection;
			
			return AstSelection.s(startLineIndex);
		}
		
		return range;
	}
	
	function hilite(e) {
		let {
			document,
			scrollPosition,
			setSelectionHilite,
			showPickOptionsFor,
			redraw,
		} = editor;
		
		let selection = getHilite(e);
		
		setSelectionHilite(selection);
		
		let {lines} = document;
		let {codeIntel} = document.lang;
		
		if (selection) {
			showPickOptionsFor(selection);
		} else {
			showPickOptionsFor(null);
		}
		
		redraw();
	}
	
	function mousedown(e, option, enableDrag) {
		let {
			canvas,
			measurements,
			document,
			hasHorizontalScrollbar,
			scrollBy,
			pick,
			redraw,
		} = editor;
		
		autoScroll(
			canvas,
			measurements,
			document,
			hasHorizontalScrollbar,
			scrollBy,
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
			
			pick(selection, null);
			
			on(window, "mouseup", mouseup);
			on(window, "dragend", dragend);
		}
		
		redraw();
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
		let {
			setInsertionHilite,
			redraw,
		} = editor;
		
		setInsertionHilite(null);
		
		redraw();
		
		editor.mouseup();
		
		off(window, "mousemove", drawSelection);
		off(window, "mouseup", finishSelection);
		off(window, "dragend", dragend);
	}
	
	function mouseenter() {
		
	}
	
	function mouseleave(e) {
		let {
			setSelectionHilite,
			redraw,
		} = editor;
		
		setSelectionHilite(null);
		redraw();
	}
	
	function click(e) {
		let {
			pick,
			redraw,
		} = editor;
		
		let selection = getHilite(e, true);
		
		if (selection) {
			pick(selection, null);
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
			document,
			selection,
		} = editor;
		
		let [startLineIndex, endLineIndex] = selection;
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
		let {
			document,
			scrollPosition,
			measurements,
			setInsertionHilite,
			showDropTargets,
			redraw,
		} = editor;
		
		if (e.ctrlKey) {
			e.dataTransfer.dropEffect = "copy";
		} else {
			e.dataTransfer.dropEffect = "move";
		}
		
		let data = getData(e);
		
		if (!data) {
			return;
		}
		
		let selection = getHilite(e);
		
		let {
			option,
		} = data;
		
		// TODO auto scroll at edges of code area
		
		showDropTargets();
		
		if (target) {
			setInsertionHilite(null);
		} else {
			setInsertionHilite(getInsertionRange(e));
		}
		
		redraw();
	}
	
	function dragenter(e) {
		
	}
	
	function dragleave(e) {
		
	}
	
	function drop(e, fromUs, toUs, extra) {
		let {
			document,
			setInsertionHilite,
			setSelection,
			applyAndAddHistoryEntry,
			clearDropTargets,
			redraw,
		} = editor;
		
		// NOTE dropEffect doesn't work when dragging between windows
		// (it will always be none in the source window)
		
		if (e.ctrlKey) {
			e.dataTransfer.dropEffect = "copy";
		} else {
			e.dataTransfer.dropEffect = "move";
		}
		
		clearDropTargets();
		setInsertionHilite(null);
		redraw();
		
		let {
			target,
		} = extra;
		
		let fromSelection;
		let toSelection;
		let lines;
		let option;
		
		let data = getData(e);
		
		if (toUs && !data) {
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
		
		if (
			fromSelection
			&& toSelection
			&& !AstSelection.isFull(toSelection)
			&& AstSelection.isAdjacent(fromSelection, toSelection)
		) {
			return;
		}
		
		let {codeIntel} = document.lang;
		
		let {
			edits,
			newSelection,
		} = codeIntel.drop(
			document,
			fromSelection,
			toSelection,
			lines,
			e.dataTransfer.dropEffect === "move",
			option,
			target,
		);
		
		if (edits.length > 0) {
			applyAndAddHistoryEntry({
				edits,
				astSelection: newSelection,
			});
		}
	}
	
	function dragend() {
		let {
			clearDropTargets,
		} = editor;
		
		clearDropTargets();
		
		mouseup();
		
		drag = null;
	}
	
	function updateHilites(e) {
		let {
			setSelectionHilite,
			showPickOptionsFor,
		} = editor;
		
		if (e) {
			hilite(e);
		} else {
			setSelectionHilite(null);
			showPickOptionsFor(null);
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
