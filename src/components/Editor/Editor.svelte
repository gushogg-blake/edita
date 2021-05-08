<script>
import {tick, onMount} from "svelte";

import sleep from "../../utils/sleep";
import inlineStyle from "../../utils/dom/inlineStyle";
import {on, off} from "../../utils/dom/domEvents";
import screenOffsets from "../../utils/dom/screenOffsets";
import autoScroll from "../../utils/dom/autoScroll";
import getKeyCombo from "../../utils/getKeyCombo";

import calculateMarginOffset from "../../modules/render/calculateMarginOffset";
import render from "../../modules/render/render";
import rowColFromScreenCoords from "../../modules/utils/rowColFromScreenCoords";
import screenCoordsFromRowCol from "../../modules/utils/screenCoordsFromRowCol";
import rowColFromCursor from "../../modules/utils/rowColFromCursor";
import cursorFromRowCol from "../../modules/utils/cursorFromRowCol";
import Selection from "../../modules/utils/Selection";

import prefs from "../../stores/prefs";

import Scrollbar from "../Scrollbar.svelte";
import normalMouse from "./normalMouse";
import astMouse from "./astMouse";

export let document;

$: prefsUpdated($prefs);

export function focus() {
	focused = true;
}

export function show() {
	visible = true;
	resize();
	redraw();
}

export function hide() {
	visible = false;
}

let mounted = false;
let canvasDiv;
let measurementsDiv;
let canvas;
let context;
let measurements;
let rowHeightPadding = 2;
let rowBaselineHint = -1;

let verticalScrollbar;
let horizontalScrollbar;
let hasHorizontalScrollbar = !$prefs.wrap;

let visible = true;
let focused = false;

let mouseIsDown = false;

let mode = "normal";

let normalSelection = {
	start: [0, 0],
	end: [0, 0],
};

let astSelection = null;
let astHilite = null;
let astCursor = null;

// for remembering the "intended" col when moving a cursor up/down to a line
// that doesn't have as many cols as the cursor
let selectionEndCol = 0;

let scrollPosition = {
	row: 0,
	x: 0,
};

let hiliteWord = null;

let cursorBlinkOn;
let cursorInterval;

async function prefsUpdated(prefs) {
	if (!mounted) {
		return;
	}
	
	hasHorizontalScrollbar = !$prefs.wrap;
	
	await tick();
	
	updateMeasurements();
	startCursorBlink();
	updateCanvasSize();
	updateWraps();
	redraw();
}

function mousedown(e) {
	mouseIsDown = true;
	//console.time("mousedown");
	if (mode === "normal") {
		normalMouse(e, {
			canvas,
			measurements,
			document,
			hasHorizontalScrollbar,
			scrollBy,
			getScrollPosition,
			redraw,
			startCursorBlink,
			
			getSelection() {
				return normalSelection;
			},
			
			setSelection(selection) {
				normalSelection = selection;
			},
			
			setSelectionEndCol(col) {
				selectionEndCol = col;
			},
			
			mouseup(e) {
				mouseIsDown = false;
			},
		});
	}
	
	if (mode === "ast") {
		astMouse(e, {
			canvas,
			measurements,
			document,
			hasHorizontalScrollbar,
			scrollBy,
			getScrollPosition,
			redraw,
			
			getSelection() {
				return astSelection;
			},
			
			setSelection(selection) {
				astSelection = selection;
			},
			
			mouseup(e) {
				mouseIsDown = false;
			},
		});
	}
	//console.timeEnd("mousedown");
}

function getScrollPosition() {
	return scrollPosition;
}

function mouseenter(e) {
	//console.log(e);
}

function mouseleave(e) {
	//console.log(e);
	
}

function keyup(e) {
	if (!focused) {
		return;
	}
}

function dragover(e) {
	console.log(e);
	e.preventDefault();
	e.dataTransfer.dropEffect = "move";
}

function drop(e) {
	console.log(e);
	let str = e.dataTransfer.getData("text/plain");
	
	console.log(str);
}

function wheel(e) {
	let dir = e.deltaY > 0 ? 1 : -1;
	
	if (e.shiftKey) {
		scrollBy(measurements.colWidth * 3 * dir, 0);
	} else {
		scrollBy(0, 3 * dir);
	}
}

function scrollBy(x, rows) {
	if (x !== 0) {
		let newX = Math.round(scrollPosition.x + x);
		
		newX = Math.max(0, newX);
		
		scrollPosition.x = newX;
	}
	
	if (rows !== 0) {
		let newRow = scrollPosition.row + rows;
		
		newRow = Math.max(0, newRow);
		newRow = Math.min(newRow, document.countRows() - 1);
		
		scrollPosition.row = newRow;
	}
	
	updateScrollbars();
	redraw();
}

function ensureSelectionIsOnScreen() {
	if (mode === "ast") {
		ensureAstSelectionIsOnScreen();
	} else {
		ensureNormalCursorIsOnScreen();
	}
}

function ensureAstSelectionIsOnScreen() {
	
}

function ensureNormalCursorIsOnScreen() {
	let {colWidth} = measurements;
	
	let {end} = normalSelection;
	let [lineIndex, offset] = end;
	let [row, col] = rowColFromCursor(document.lines, lineIndex, offset);
	
	let {width, rows} = getCodeAreaSize();
	let maxRow = document.countRows() - 1;
	let firstVisibleRow = scrollPosition.row;
	let lastFullyVisibleRow = firstVisibleRow + rows;
	
	let idealRowBuffer = 5;
	
	let topRowDiff = idealRowBuffer - (row - firstVisibleRow);
	
	if (topRowDiff > 0) {
		scrollPosition.row = Math.max(0, scrollPosition.row - topRowDiff);
	}
	
	let bottomRowDiff = idealRowBuffer - (lastFullyVisibleRow - row);
	
	if (bottomRowDiff > 0) {
		scrollPosition.row = Math.min(scrollPosition.row + bottomRowDiff, maxRow);
	}
	
	let colBuffer = 8;
	
	let [x] = screenCoordsFromRowCol(document.lines, row, col, scrollPosition, measurements);
	
	x -= calculateMarginOffset(document.lines, measurements);
	
	if (x < 1) {
		scrollPosition.x = Math.max(0, scrollPosition.x - x - colBuffer * colWidth);
	}
}

function updateSelectionEndCol() {
	let [lineIndex, offset] = normalSelection.end;
	let [, endCol] = rowColFromCursor(document.lines, lineIndex, offset);
	
	selectionEndCol = endCol;
}

function keydown(e) {
	if (!focused) {
		return;
	}
	
	let {keyCombo, isModified} = getKeyCombo(e);
	
	let keymap = keymaps[mode];
	
	if (keymap[keyCombo]) {
		functions[mode][keymap[keyCombo]]();
	} else if (keymaps.common[keyCombo]) {
		functions.common[keymaps.common[keyCombo]]();
	} else {
		if (functions[mode].default) {
			functions[mode].default(e, keyCombo, isModified);
		} else {
			//functions.common.default(e, keyCombo, isModified);
		}
	}
	
	console.log(keyCombo);
	
	ensureSelectionIsOnScreen();
	updateScrollbars();
	startCursorBlink();
	redraw();
}

let normalFunctions = {
	up() {
		normalSelection = Selection.up(document.lines, normalSelection, selectionEndCol);
	},
	
	down() {
		normalSelection = Selection.down(document.lines, normalSelection, selectionEndCol);
	},
	
	left() {
		normalSelection = Selection.left(document.lines, normalSelection);
		
		updateSelectionEndCol();
	},
	
	right() {
		normalSelection = Selection.right(document.lines, normalSelection);
		
		updateSelectionEndCol();
	},
	
	pageUp() {
		let {rows} = getCodeAreaSize();
		
		normalSelection = Selection.pageUp(document.lines, rows, normalSelection, selectionEndCol);
	},
	
	pageDown() {
		let {rows} = getCodeAreaSize();
		
		normalSelection = Selection.pageDown(document.lines, rows, normalSelection, selectionEndCol);
	},
	
	end() {
		normalSelection = Selection.end(document.lines, normalSelection);
		
		updateSelectionEndCol();
	},
	
	home() {
		normalSelection = Selection.end(document.lines, normalSelection);
		
		updateSelectionEndCol();
	},
	
	expandOrContractSelectionUp() {
		normalSelection = Selection.expandOrContractUp(document.lines, normalSelection, selectionEndCol);
	},
	
	expandOrContractSelectionDown() {
		normalSelection = Selection.expandOrContractDown(document.lines, normalSelection, selectionEndCol);
	},
	
	expandOrContractSelectionLeft() {
		normalSelection = Selection.expandOrContractLeft(document.lines, normalSelection);
		
		updateSelectionEndCol();
	},
	
	expandOrContractSelectionRight() {
		normalSelection = Selection.expandOrContractRight(document.lines, normalSelection);
		
		updateSelectionEndCol();
	},
	
	expandOrContractSelectionPageUp() {
		let {rows} = getCodeAreaSize();
		
		normalSelection = Selection.expandOrContractPageUp(document.lines, rows, normalSelection, selectionEndCol);
	},
	
	expandOrContractSelectionPageDown() {
		let {rows} = getCodeAreaSize();
		
		normalSelection = Selection.expandOrContractPageDown(document.lines, rows, normalSelection, selectionEndCol);
	},
	
	expandOrContractSelectionEnd() {
		normalSelection = Selection.expandOrContractEnd(document.lines, normalSelection);
		
		updateSelectionEndCol();
	},
	
	expandOrContractSelectionHome() {
		normalSelection = Selection.expandOrContractHome(document.lines, normalSelection);
		
		updateSelectionEndCol();
	},
	
	
	switchToAstMode() {
		switchToAstMode();
	},
	
	enter() {
		normalSelection = document.insertNewline(normalSelection);
	},
	
	enterNoAutoIndent() {
		//normalSelection = document.insertNewlineNoAutoIndent(normalSelection);
	},
	
	backspace() {
		normalSelection = document.backspace(normalSelection);
	},
	
	delete() {
		normalSelection = document.delete(normalSelection);
	},
	
	tab() {
		// TODO snippets
		
		normalSelection = document.insertCharacter(normalSelection, "\t");
	},
	
	shiftTab() {
		// TODO
	},
	
	default(e, keyCombo, isModified) {
		if (!isModified && e.key.length === 1) {
			normalSelection = document.insertCharacter(normalSelection, e.key);
		}
	},
};

let astFunctions = {
	
	switchToNormalMode() {
		switchToNormalMode();
	},
};

let commonFunctions = {
	
};

let functions = {
	normal: normalFunctions,
	ast: astFunctions,
	common: commonFunctions,
};

let normalKeymap = {
	"ArrowUp": "up",
	"ArrowDown": "down",
	"ArrowLeft": "left",
	"ArrowRight": "right",
	"PageUp": "pageUp",
	"PageDown": "pageDown",
	"End": "end",
	"Home": "home",
	"Shift+ArrowUp": "expandOrContractSelectionUp",
	"Shift+ArrowDown": "expandOrContractSelectionDown",
	"Shift+ArrowLeft": "expandOrContractSelectionLeft",
	"Shift+ArrowRight": "expandOrContractSelectionRight",
	"Shift+PageUp": "expandOrContractSelectionPageUp",
	"Shift+PageDown": "expandOrContractSelectionPageDown",
	"Shift+End": "expandOrContractSelectionEnd",
	"Shift+Home": "expandOrContractSelectionHome",
	"Backspace": "backspace",
	"Delete": "delete",
	"Enter": "enter",
	"Tab": "tab",
	"Shift+Backspace": "backspace",
	"Shift+Delete": "delete",
	"Shift+Enter": "enter",
	"Ctrl+Enter": "enterNoAutoIndent",
	"Shift+Tab": "shiftTab",
	"Escape": "switchToAstMode",
};

let astKeymap = {
	"PageUp": "pageUp",
	"PageDown": "pageDown",
	"Escape": "switchToNormalMode",
};

let commonKeymap = {
};

let keymaps = {
	normal: normalKeymap,
	ast: astKeymap,
	common: commonKeymap,
};

function switchToAstMode() {
	if (mouseIsDown) {
		return;
	}
	
	mode = "ast";
	
	let [lineIndex] = normalSelection.end;
	
	astSelection = document.lang.codeIntel.astSelectionFromLineIndex(document.lines, lineIndex);
}

function switchToNormalMode() {
	if (mouseIsDown) {
		return;
	}
	
	mode = "normal";
}

function startCursorBlink() {
	if (cursorInterval) {
		clearInterval(cursorInterval);
	}
	
	cursorBlinkOn = true;
	
	cursorInterval = setInterval(function() {
		cursorBlinkOn = !cursorBlinkOn;
		
		updateCanvas();
	}, $prefs.cursorBlinkPeriod);
}

function updateCanvasSize() {
	canvas.width = canvasDiv.offsetWidth;
	canvas.height = canvasDiv.offsetHeight;
	
	/*
	setting width/height resets the context, so need to apply things
	like textBaseline here
	*/
	
	context.textBaseline = "bottom";
}

function updateWraps() {
	if ($prefs.wrap) {
		document.wrapLines(
			measurements,
			getCodeAreaSize().width,
		);
	} else {
		document.unwrapLines();
	}
}

let prevWidth;
let prevHeight;

function resize() {
	let {offsetWidth, offsetHeight} = canvasDiv;
	
	if (offsetWidth !== prevWidth || offsetHeight !== prevHeight) {
		updateCanvasSize();
		
		if (offsetWidth !== prevWidth) {
			updateWraps();
		}
		
		redraw();
		
		prevWidth = offsetWidth;
		prevHeight = offsetHeight;
	}
	
	if (visible) {
		setTimeout(resize, 50);
	}
}

function redraw() {
	updateScrollbars();
	updateCanvas();
}

function updateCanvas() {
	render(
		context,
		mode,
		document.lines,
		normalSelection,
		astSelection,
		astHilite,
		astCursor,
		hiliteWord,
		scrollPosition,
		$prefs,
		document.fileDetails,
		$prefs.langs[document.lang.code].colors,
		measurements,
		cursorBlinkOn,
	);
}

function updateMeasurements() {
	measurementsDiv.style = inlineStyle({
		font: $prefs.font,
	});
	
	measurementsDiv.innerHTML = "A".repeat(10000);
	
	measurements = {
		colWidth: measurementsDiv.offsetWidth / measurementsDiv.innerHTML.length,
		rowHeight: measurementsDiv.offsetHeight + rowHeightPadding,
	};
}

async function updateScrollbars() {
	updateVerticalScrollbar();
	updateHorizontalScrollbar();
	
	await tick();
	
	updateCanvasSize();
	updateCanvas();
}

function updateVerticalScrollbar() {
	let {rowHeight} = measurements;
	let {offsetHeight: height} = canvasDiv;
	
	let rows = document.countRows();
	
	let scrollHeight = (rows - 1) * rowHeight + height;
	let scrollTop = scrollPosition.row * rowHeight;
	let scrollMax = scrollHeight - height;
	let position = scrollTop / scrollMax;
	
	verticalScrollbar.update(scrollHeight, height, position);
}

function updateHorizontalScrollbar() {
	if (!hasHorizontalScrollbar) {
		return;
	}
	
	let {colWidth} = measurements;
	let {width} = getCodeAreaSize();
	
	let longestLineWidth = document.getLongestLineWidth();
	
	let scrollWidth = longestLineWidth * colWidth + width;
	let scrollMax = scrollWidth - width;
	let scrollLeft = scrollPosition.x;
	let position = scrollLeft / scrollMax;
	
	horizontalScrollbar.update(scrollWidth, width, position);
}

function verticalScroll({detail: position}) {
	let {rowHeight} = measurements;
	let {height} = canvas;
	
	let rows = document.countRows();
	let scrollHeight = (rows - 1) * rowHeight + height;
	let scrollMax = scrollHeight - height;
	
	let scrollTop = scrollMax * position;
	let scrollRows = Math.round(scrollTop / rowHeight);
	
	scrollPosition.row = scrollRows;
	
	updateCanvas();
}

function horizontalScroll({detail: position}) {
	let {colWidth} = measurements;
	let {width} = canvas;
	
	let longestLineWidth = document.getLongestLineWidth();
	let scrollWidth = longestLineWidth * colWidth + width;
	let scrollMax = scrollWidth - width;
	
	let scrollLeft = scrollMax * position;
	
	scrollPosition.x = scrollLeft;
	
	updateCanvas();
}

function getCodeAreaSize() {
	let {width, height} = canvas;
	
	let {
		colWidth,
		rowHeight,
	} = measurements;
	
	return {
		width: width - calculateMarginOffset(document.lines, measurements),
		height,
		rows: Math.floor(height / rowHeight),
		cols: Math.floor(width / colWidth),
	};
}

onMount(async function() {
	context = canvas.getContext("2d");
	
	document.parse($prefs);
	
	updateMeasurements();
	resize();
	startCursorBlink();
	
	let teardown = [];
	
	teardown.push(document.on("edit", function() {
		// TODO perf
		// only modified lines need wraps recalculating
		// async parsing
		
		document.parse($prefs);
		
		updateWraps();
	}));
	
	focused = true; // DEV
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});

$: canvasStyle = {
	cursor: "text",
};
</script>

<svelte:window
	on:keydown={keydown}
	on:keyup={keyup}
/>

<style type="text/scss">
@import "../../css/mixins/abs-sticky";
@import "../../css/classes/hide";

#main {
	display: grid;
	grid-template-rows: 1fr 0;
	grid-template-columns: 1fr 13px;
	grid-template-areas: "canvas verticalScrollbar" "horizontalScrollbar blank";
	color: black;
	
	/*width: 300px;
	height: 300px;
	margin: 50px;*/
	
	&.hasHorizontalScrollbar {
		grid-template-rows: 1fr 13px;
	}
}

#canvas {
	position: relative;
	grid-area: canvas;
	overflow: hidden;
}

canvas {
	@include abs-sticky;
	
	z-index: 1;
}

$scrollBarBorder: 1px solid #bababa;

#verticalScrollbar {
	position: relative;
	grid-area: verticalScrollbar;
	border-left: $scrollBarBorder;
}

#horizontalScrollbar {
	position: relative;
	grid-area: horizontalScrollbar;
	border-top: $scrollBarBorder;
}

#scrollbarSpacer {
	grid-area: blank;
	background: #E8E8E8;
}

#measurements {
	position: absolute;
	left: -9000px;
	top: -9000px;
}
</style>

<div
	id="main"
	on:wheel={wheel}
	class:hasHorizontalScrollbar
>
	<div
		id="canvas"
		bind:this={canvasDiv}
	>
		<canvas
			bind:this={canvas}
			on:mousedown={mousedown}
			on:mouseenter={mouseenter}
			on:mouseleave={mouseleave}
			on:dragover={dragover}
			on:drop={drop}
			style={inlineStyle(canvasStyle)}
		/>
	</div>
	<div
		class="scrollbar"
		id="verticalScrollbar"
	>
		<Scrollbar
			bind:this={verticalScrollbar}
			orientation="vertical"
			on:scroll={verticalScroll}
		/>
	</div>
	<div
		class="scrollbar"
		class:hide={!hasHorizontalScrollbar}
		id="horizontalScrollbar"
	>
		<Scrollbar
			bind:this={horizontalScrollbar}
			orientation="horizontal"
			on:scroll={horizontalScroll}
		/>
	</div>
	{#if hasHorizontalScrollbar}
		<div id="scrollbarSpacer"></div>
	{/if}
</div>

<div id="measurements" bind:this={measurementsDiv}></div>
