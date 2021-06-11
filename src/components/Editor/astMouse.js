let {on, off} = require("../../utils/dom/domEvents");
let rowColFromScreenCoords = require("../../modules/utils/rowColFromScreenCoords");
let rowColFromCursor = require("../../modules/utils/rowColFromCursor");
let cursorFromRowCol = require("../../modules/utils/cursorFromRowCol");
let screenRowFromLineIndex = require("../../modules/utils/screenRowFromLineIndex");
let AstSelection = require("../../modules/utils/AstSelection");
let Selection = require("../../modules/utils/Selection");
let autoScroll = require("./utils/autoScroll");

module.exports = function(editor) {
	let drawingSelection = false;
	
	function getHilite(e) {
		let {
			canvas,
			measurements,
			document,
			selection,
			isPeekingAstMode: isPeeking,
			normalSelection,
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
		
		if (row < document.countRows()) {
			let [lineIndex] = cursorFromRowCol(document.lines, row, col);
			
			let hilite = document.lang.codeIntel.astSelection.hiliteFromLineIndex(document.lines, lineIndex);
			
			if (
				isPeeking
				&& hilite
				&& AstSelection.isWithin(hilite, selection)
				&& Selection.isFull(normalSelection)
			) {
				hilite = selection;
			}
			
			return hilite;
		}
		
		return null;
	}
	
	function hilite(e) {
		let {
			document,
			scrollPosition,
			setSelectionHilite,
			setPickOptions,
			showDropTargetsFor,
			redraw,
		} = editor;
		
		let selection = getHilite(e);
		
		setSelectionHilite(selection);
		
		let {lines} = document;
		let {codeIntel} = document.lang;
		
		if (selection) {
			let [startLineIndex] = selection;
			let pickOptions = codeIntel.generatePickOptions(lines, selection);
			
			setPickOptions(pickOptions.map(function(type) {
				let screenCol = lines[startLineIndex].width + 1;
				
				return {
					screenRow: screenRowFromLineIndex(lines, startLineIndex, scrollPosition),
					screenCol,
					type,
					label: codeIntel.pickOptions[type].label,
				};
			}));
			
			showDropTargetsFor(selection, null);
		} else {
			setPickOptions([]);
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
			setSelection,
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
	
	function dragstart(e) {
		
	}
	
	function dragover(e, option, target) {
		let {
			document,
			setSelectionHilite,
			setPickOptions,
			showDropTargetsFor,
			redraw,
		} = editor;
		
		let selection = getHilite(e);
		
		setSelectionHilite(selection);
		
		redraw();
	}
	
	function dragenter(e) {
		
	}
	
	function dragleave(e) {
		
	}
	
	function drop(e) {
		
	}
	
	function dragend() {
		mouseup();
	}

	return {
		mousedown,
		mousemove,
		mouseenter,
		mouseleave,
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
