<script>
import {tick, onMount} from "svelte";

import sleep from "../../utils/sleep";
import inlineStyle from "../../utils/dom/inlineStyle";
import {on, off} from "../../utils/dom/domEvents";
import screenOffsets from "../../utils/dom/screenOffsets";
import autoScroll from "../../utils/dom/autoScroll";
import windowFocus from "../../utils/dom/windowFocus";
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
import normalKeyboard from "./normalKeyboard";
import astKeyboard from "./astKeyboard";

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
let windowHasFocus;

let normalMouseHandler = normalMouse({
	get canvas() {
		return canvas;
	},
	
	get measurements() {
		return measurements;
	},
	
	get document() {
		return document;
	},
	
	get hasHorizontalScrollbar() {
		return hasHorizontalScrollbar;
	},
	
	get scrollPosition() {
		return scrollPosition;
	},
	
	get selection() {
		return normalSelection;
	},
	
	scrollBy,
	redraw,
	startCursorBlink,
	
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

let astMouseHandler = astMouse({
	get canvas() {
		return canvas;
	},
	
	get measurements() {
		return measurements;
	},
	
	get document() {
		return document;
	},
	
	get hasHorizontalScrollbar() {
		return hasHorizontalScrollbar;
	},
	
	get scrollPosition() {
		return scrollPosition;
	},
	
	get selection() {
		return astSelection;
	},
	
	setSelection(selection) {
		astSelection = selection;
	},
	
	scrollBy,
	redraw,
	
	mouseup(e) {
		mouseIsDown = false;
	},
});

let mouseIsDown = false;

let normalKeyboardHandler = normalKeyboard({
	get document() {
		return document;
	},
	
	get selection() {
		return astSelection;
	},
	
	get selectionEndCol() {
		return selectionEndCol;
	},
	
	setSelection(selection) {
		normalSelection = selection;
	},
	
	switchToAstMode,
	getCodeAreaSize,
	updateSelectionEndCol,
	ensureSelectionIsOnScreen,
	updateScrollbars,
	startCursorBlink,
	redraw,
});

let astKeyboardHandler = astKeyboard({
	get document() {
		return document;
	},
	
	get selection() {
		return astSelection;
	},
	
	get selectionEndCol() {
		return selectionEndCol;
	},
	
	setSelection(selection) {
		astSelection = selection;
	},
	
	switchToNormalMode,
	getCodeAreaSize,
	ensureSelectionIsOnScreen,
	updateScrollbars,
	startCursorBlink,
	redraw,
});

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

async function prefsUpdated() {
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
	
	if (mode === "normal") {
		normalMouseHandler.mousedown(e);
	} else if (mode === "ast") {
		astMouseHandler.mousedown(e);
	}
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
	
	if (mode === "normal") {
		normalKeyboardHandler.keydown(e);
	} else if (mode === "ast") {
		astKeyboardHandler.keydown(e);
	}
}

function switchToAstMode() {
	if (mouseIsDown) {
		return;
	}
	
	mode = "ast";
	
	let [lineIndex] = normalSelection.end;
	
	astSelection = document.lang.codeIntel.astSelection.fromLineIndex(document.lines, lineIndex);
}

function switchToNormalMode() {
	if (mouseIsDown) {
		return;
	}
	
	mode = "normal";
	
	let [topLineIndex] = astSelection;
	
	normalSelection = Selection.startOfLineContent(document.lines, topLineIndex);
	
	updateSelectionEndCol();
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
	if (!canvasDiv) {
		return;
	}
	
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
		windowHasFocus,
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
	
	focused = true; // DEV
	
	windowHasFocus = windowFocus.isFocused();
	
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
	
	teardown.push(windowFocus.listen(function(isFocused) {
		windowHasFocus = isFocused;
		
		updateCanvas();
	}));
	
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
