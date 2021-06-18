let parseJson = require("../../utils/parseJson");
let {on, off} = require("../../utils/dom/domEvents");
let rowColFromScreenCoords = require("../../modules/utils/rowColFromScreenCoords");
let rowColFromCursor = require("../../modules/utils/rowColFromCursor");
let cursorFromRowCol = require("../../modules/utils/cursorFromRowCol");
let insertLineIndexFromScreenY = require("../../modules/utils/insertLineIndexFromScreenY");
let AstSelection = require("../../modules/utils/AstSelection");
let Selection = require("../../modules/utils/Selection");
let autoScroll = require("./utils/autoScroll");

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
	let isDragging = false;
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
		
		if (!withinSelection && AstSelection.lineIsWithinSelection(lineIndex, selection)) {
			return selection;
		} else {
			return document.lang.codeIntel.astSelection.hiliteFromLineIndex(document.lines, lineIndex);
		}
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
			showDropTargetsFor,
			redraw,
		} = editor;
		
		let selection = getHilite(e);
		
		setSelectionHilite(selection);
		
		let {lines} = document;
		let {codeIntel} = document.lang;
		
		if (selection) {
			showPickOptionsFor(selection);
			showDropTargetsFor(selection, null);
		} else {
			showPickOptionsFor(null);
			showDropTargetsFor(null, null);
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
		
	}
	
	function mousemove(e) {
		if (drawingSelection) {
			return;
		}
		
		requestAnimationFrame(function() {
			hilite(e);
		});
	}
	
	function mouseup() {
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
		
		redraw();
	}
	
	function dblclick(e) {
		
	}
	
	function optionmousedown(option, e) {
		let {
			pick,
		} = editor;
		
		pick(getHilite(e), option);
	}
	
	function optionhover(option, e) {
		let {
			showDropTargetsFor,
		} = editor;
		
		showDropTargetsFor(getHilite(e), option);
	}
	
	function dragstart(e, option) {
		let {
			document,
			selection,
		} = editor;
		
		let [startLineIndex, endLineIndex] = selection;
		
		let lines = document.lines.slice(startLineIndex, endLineIndex).map(function(line) {
			return line.string;
		});
		
		setData(e, {
			selection,
			option,
			lines,
		});
		
		isDragging = true;
	}
	
	function dragover(e, target) {
		let {
			document,
			scrollPosition,
			measurements,
			setInsertionHilite,
			showDropTargetsFor,
			redraw,
		} = editor;
		
		e.preventDefault();
		
		let data = getData(e);
		
		if (!data) {
			return;
		}
		
		if (target) {
			setInsertionHilite(null);
		} else {
			setInsertionHilite(getInsertionRange(e));
		}
		
		redraw();
	}
	
	function dragenter(e) {
		e.preventDefault();
	}
	
	function dragleave(e) {
		
	}
	
	function drop(e, target) {
		let {
			document,
		} = editor;
		
		function done() {
			isDragging = false;
		}
		
		let data = getData(e);
		
		if (!data) {
			return done();
		}
		
		let {
			selection: fromSelection,
			option,
			lines,
		} = data;
		
		if (!isDragging) {
			fromSelection = null;
		}
		
		let toSelection = target ? getHilite(e) : getInsertionRange(e);
		
		let {codeIntel} = document.lang;
		
		codeIntel.drop(
			document,
			fromSelection,
			toSelection,
			lines,
			option,
			target,
		);
		
		done();
	}
	
	function dragend() {
		mouseup();
		
		isDragging = false;
	}

	return {
		mousedown,
		mousemove,
		mouseenter,
		mouseleave,
		click,
		dblclick,
		optionmousedown,
		optionhover,
		dragstart,
		dragover,
		dragenter,
		dragleave,
		drop,
		dragend,
		hilite,
	};
}
