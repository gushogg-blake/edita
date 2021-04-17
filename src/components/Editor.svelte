<script>
import {tick} from "svelte";
import calculateMarginOffset from "../modules/render/calculateMarginOffset";
import render from "../modules/render/render";
import rowColFromScreenCoords from "../modules/utils/rowColFromScreenCoords";
import rowColFromCursor from "../modules/utils/rowColFromCursor";
import cursorFromRowCol from "../modules/utils/cursorFromRowCol";
import Selection from "../modules/utils/Selection";
import getKeyCombo from "../utils/getKeyCombo";
/*
let js = require("../src/modules/langs/js");
let render = require("../src/modules/render/render");
let calculateMarginOffset = require("../src/modules/render/calculateMarginOffset");

*/
import {onMount} from "svelte";
import sleep from "../utils/sleep";
import inlineStyle from "../utils/dom/inlineStyle";
import {on, off} from "../utils/dom/domEvents";
import screenOffsets from "../utils/dom/screenOffsets";
import autoScroll from "../utils/dom/autoScroll";
//import render from "../modules/render/render";
import prefs from "../stores/prefs";
import Scrollbar from "./Scrollbar.svelte";

export let document;

$: prefsUpdated($prefs);

export function focus() {
	focused = true;
}

export function show() {
	visible = true;
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
let hasHorizontalScrollbar = $prefs.wrap;

let visible = true;
let focused = false;

let dragSelectionEnd;
let draggingSelection = false;

let selection = {
	start: [0, 0],
	end: [0, 0],
};

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
	
	hasHorizontalScrollbar = $prefs.wrap;
	
	await tick();
	
	updateMeasurements();
	startCursorBlink();
	updateCanvasSize();
	updateWraps();
	redraw();
}

function mousedown(e) {
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
	
	let cursor = cursorFromRowCol(
		document.lines,
		row,
		col,
	);
	
	selection = {
		start: cursor,
		end: cursor,
	};
	
	let [lineIndex, offset] = cursor;
	let [, endCol] = rowColFromCursor(document.lines, lineIndex, offset);
	
	selectionEndCol = endCol;
	
	startCursorBlink();
	
	redraw();
	
	draggingSelection = true;
	
	on(window, "mousemove", mousemove);
	on(window, "mouseup", mouseup);
	
	let offsets = screenOffsets(canvasDiv);
	
	offsets.left += calculateMarginOffset(document.lines, measurements);
	
	autoScroll(offsets, function(x, y) {
		let xOffset = x === 0 ? 0 : Math.round(Math.max(1, Math.pow(1.2, Math.abs(x)) / 30));
		let rows = y === 0 ? 0 : Math.round(Math.max(1, Math.pow(2, Math.abs(y) / 30)));
		
		if (x < 0) {
			xOffset = -xOffset;
		}
		
		if (y < 0) {
			rows = -rows;
		}
		
		scrollBy(xOffset, rows);
	});
}

function mousemove(e) {
	//console.log(e);
	if (draggingSelection) {
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
		
		let cursor = cursorFromRowCol(
			document.lines,
			row,
			col,
		);
		
		selection.end = cursor;
		
		selectionEndCol = col;
		
		redraw();
	}
}

function mouseup(e) {
	draggingSelection = false;
	
	console.log(e);
	
	off(window, "mousemove", mousemove);
	off(window, "mouseup", mouseup);
}

function mouseenter(e) {
	//console.log(e);
}

function mouseleave(e) {
	//console.log(e);
	
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
	
	updateScrollbars();
	redraw();
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
}

function keydown(e) {
	if (!focused) {
		return;
	}
	
	let {keyCombo, isModified} = getKeyCombo(e);
	
	if (!isModified && e.key.length === 1) {
		// printable character other than tab or enter
		
		selection = document.insertCharacter(selection, e.key);
	} else if (keyCombo === "Tab") {
		// TODO snippets
		
		selection = document.insertCharacter(selection, "\t");
	} else if (keyCombo === "Enter") {
		selection = document.insertNewline(selection);
	} else if (keyCombo === "Backspace") {
		selection = document.backspace(selection);
	} else if (keyCombo === "Delete") {
		selection = document.delete(selection);
	} else if (keymap[keyCombo]) {
		functions[keymap[keyCombo]]();
	}
	
	updateScrollbars();
	startCursorBlink();
	redraw();
}

let functions = {
	moveSelectionUp() {
		selection = Selection.up(document.lines, selection, selectionEndCol);
	},
	
	moveSelectionDown() {
		selection = Selection.down(document.lines, selection, selectionEndCol);
	},
	
	moveSelectionLeft() {
		selection = Selection.left(document.lines, selection, selectionEndCol);
		
		let [lineIndex, offset] = selection.end;
		let [, endCol] = rowColFromCursor(document.lines, lineIndex, offset);
		
		selectionEndCol = endCol;
	},
	
	moveSelectionRight() {
		selection = Selection.right(document.lines, selection, selectionEndCol);
		
		let [lineIndex, offset] = selection.end;
		let [, endCol] = rowColFromCursor(document.lines, lineIndex, offset);
		
		selectionEndCol = endCol;
	},
	
	expandOrContractSelectionUp() {
		selection = Selection.expandOrContractUp(document.lines, selection, selectionEndCol);
	},
	
	expandOrContractSelectionDown() {
		selection = Selection.expandOrContractDown(document.lines, selection, selectionEndCol);
	},
	
	pageUp() {
		let {rowHeight} = measurements;
		let {offsetHeight: height} = canvasDiv;
		let screenRows = Math.floor(height / rowHeight);

		scrollPosition.row -= screenRows;
		
		scrollPosition.row = Math.max(0, scrollPosition.row);
	},
	
	pageDown() {
		let {rowHeight} = measurements;
		let {offsetHeight: height} = canvasDiv;
		let screenRows = Math.floor(height / rowHeight);
		let rows = document.countRows();
		let maxRow = rows - 1;
		
		scrollPosition.row += screenRows;
		
		scrollPosition.row = Math.min(scrollPosition.row, maxRow);
	},
};

let keymap = {
	"ArrowUp": "moveSelectionUp",
	"ArrowDown": "moveSelectionDown",
	"ArrowLeft": "moveSelectionLeft",
	"ArrowRight": "moveSelectionRight",
	"PageUp": "pageUp",
	"PageDown": "pageDown",
	"Shift+ArrowUp": "expandOrContractSelectionUp",
	"Shift+ArrowDown": "expandOrContractSelectionDown",
};

function keyup(e) {
	if (!focused) {
		return;
	}
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
	document.wrapLines(
		$prefs,
		measurements,
		canvas.width - calculateMarginOffset(document.lines, measurements),
	);
}

function resize() {
	updateCanvasSize();
	updateWraps();
	redraw();
}

function redraw() {
	updateScrollbars();
	updateCanvas();
}

function updateCanvas() {
	//requestAnimationFrame(function() {
		render(
			context,
			document.lines,
			selection,
			hiliteWord,
			scrollPosition,
			document.lang,
			$prefs,
			$prefs.langs[document.lang.code].colors,
			measurements,
			cursorBlinkOn,
		);
	//});
}

function updateMeasurements() {
	measurementsDiv.style = inlineStyle({
		font: $prefs.font,
	});
	
	measurementsDiv.innerHTML = "A".repeat(100);
	
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
	let {offsetWidth: width} = canvasDiv;
	
	width -= calculateMarginOffset(document.lines, measurements);
	
	let longestLineWidth = document.getLongestLineWidth();
	
	let scrollWidth = longestLineWidth * colWidth + width;
	let scrollMax = scrollWidth - width;
	let scrollLeft = scrollPosition.x;
	let position = scrollLeft / scrollMax;
	
	horizontalScrollbar.update(scrollWidth, width, position);
}

function verticalScroll({detail: position}) {
	let {rowHeight} = measurements;
	let {offsetHeight: height} = canvasDiv;
	
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
	let {offsetWidth: width} = canvasDiv;
	
	let longestLineWidth = document.getLongestLineWidth();
	let scrollWidth = longestLineWidth * colWidth + width;
	let scrollMax = scrollWidth - width;
	
	let scrollLeft = scrollMax * position;
	
	scrollPosition.x = scrollLeft;
	
	updateCanvas();
}

onMount(async function() {
	context = canvas.getContext("2d");
	
	document.parse($prefs);
	
	updateMeasurements();
	startCursorBlink();
	updateCanvasSize();
	updateWraps();
	redraw();
	
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
	on:resize={resize}
	on:keydown={keydown}
	on:keyup={keyup}
/>

<style type="text/scss">
@import "../css/mixins/abs-sticky";
@import "../css/classes/hide";

#main {
	display: grid;
	grid-template-rows: 1fr 0;
	grid-template-columns: 1fr 13px;
	grid-template-areas: "canvas verticalScrollbar" "horizontalScrollbar blank";
	width: 100%;
	height: 100%;
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
