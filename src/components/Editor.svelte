<script>
import {tick} from "svelte";
import calculateMarginOffset from "../modules/render/calculateMarginOffset";
import render from "../modules/render/render";
import cursorFromScreenCoords from "../modules/utils/cursorFromScreenCoords";
import Selection from "../modules/Selection";
import getKeyCombo from "../utils/getKeyCombo";
/*
let js = require("../src/modules/langs/js");
let render = require("../src/modules/render/render");
let calculateMarginOffset = require("../src/modules/render/calculateMarginOffset");

*/
import {onMount} from "svelte";
import sleep from "../utils/sleep";
import inlineStyle from "../utils/dom/inlineStyle";
//import render from "../modules/render/render";
import prefs from "../stores/prefs";
import Scrollbar from "./Scrollbar.svelte";

export let document;

let hasVerticalScrollbar = true;
let hasHorizontalScrollbar = true;

export function focus() {
	focused = true;
}

let canvasDiv;
let measurementsDiv;
let canvas;
let context;
let measurements;
let rowHeightPadding = 2;
let rowBaselineHint = -1;

let verticalScrollbar;
let horizontalScrollbar;

let focused = false;

let dragSelectionEnd;
let draggingSelection = false;

let selection = {
	start: [0, 0],
	end: [0, 0],
};

let scrollPosition = {
	row: 0,
	x: 0,
};

let hiliteWord = null;

let cursorBlinkOn;
let cursorInterval;

function startCursorBlink() {
	if (cursorInterval) {
		clearInterval(cursorInterval);
	}
	
	cursorBlinkOn = true;
	
	cursorInterval = setInterval(function() {
		cursorBlinkOn = !cursorBlinkOn;
		
		redraw();
	}, $prefs.cursorBlinkPeriod);
}

function mousedown(e) {
	let {
		x: left,
		y: top,
	} = canvas.getBoundingClientRect();
	
	let x = e.clientX - left;
	let y = e.clientY - top;
	
	let [lineIndex, offset] = cursorFromScreenCoords(
		document.lines,
		x,
		y,
		scrollPosition,
		measurements,
	);
	
	selection = {
		start: [lineIndex, offset],
		end: [lineIndex, offset],
	};
	
	startCursorBlink();
	
	redraw();
	
	draggingSelection = true;
}

function mousemove(e) {
	if (draggingSelection) {
		let {
			x: left,
			y: top,
		} = canvas.getBoundingClientRect();
		
		let x = e.clientX - left;
		let y = e.clientY - top;
		
		let [lineIndex, offset] = cursorFromScreenCoords(
			document.lines,
			x,
			y,
			scrollPosition,
			measurements,
		);
		
		selection.end = [lineIndex, offset];
		
		redraw();
	}
}

function mouseup(e) {
	draggingSelection = false;
}

function wheel(e) {
	let dir = e.deltaY > 0 ? 1 : -1;
	
	if (e.shiftKey) {
		let newX = Math.round(scrollPosition.x + measurements.colWidth * 3 * dir);
		
		newX = Math.max(0, newX);
		
		scrollPosition.x = newX;
	} else {
		let newRow = scrollPosition.row + 3 * dir;
		
		newRow = Math.max(0, newRow);
		newRow = Math.min(newRow, document.countRows() - 1);
		
		scrollPosition.row = newRow;
	}
	
	updateScrollbars();
	redraw();
}

function resize() {
	canvas.width = canvasDiv.offsetWidth;
	canvas.height = canvasDiv.offsetHeight;
	
	/*
	setting width/height resets the context, so need to apply things
	like textBaseline here
	*/
	
	context.textBaseline = "bottom";
	
	document.wrapLines(
		$prefs,
		measurements,
		canvas.width - calculateMarginOffset(document.lines, measurements),
	);
	
	redraw();
}

function redraw() {
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

function keydown(e) {
	if (!focused) {
		return;
	}
	
	let {keyCombo, isModified} = getKeyCombo(e);
	
	let [lineIndex, offset] = Selection.sort(selection).start;
	
	if (!isModified && e.key.length === 1) {
		// printable character other than tab or enter
		
		selection = document.insertCharacter(selection, e.key);
		
		redraw();
	}
	
	if (keyCombo === "Tab") {
		selection = document.insertCharacter(selection, "\t");
		
		redraw();
	}
	
	if (keyCombo === "Backspace") {
		selection = document.backspace(selection);
		
		redraw();
	}
	
	if (keyCombo === "Delete") {
		selection = document.delete(selection);
		
		redraw();
	}
	
	if (keyCombo === "Enter") {
		selection = document.insertNewline(selection);
		
		redraw();
	}
	
	if (keyCombo === "PageDown") {
		let {rowHeight} = measurements;
		let {offsetHeight: height} = canvasDiv;
		let screenRows = Math.floor(height / rowHeight);
		let rows = document.countRows();
		let maxRow = rows - 1;
		
		scrollPosition.row += screenRows;
		
		scrollPosition.row = Math.min(scrollPosition.row, maxRow);
		
		updateScrollbars();
		redraw();
	}
	
	if (keyCombo === "PageUp") {
		let {rowHeight} = measurements;
		let {offsetHeight: height} = canvasDiv;
		let screenRows = Math.floor(height / rowHeight);

		scrollPosition.row -= screenRows;
		
		scrollPosition.row = Math.max(0, scrollPosition.row);
		
		updateScrollbars();
		redraw();
	}
	
	if (keyCombo === "Shift+ArrowUp") {
		selection = Selection.expandUp(document.lines, selection);
	}
}

function keyup(e) {
	if (!focused) {
		return;
	}
	
}

async function updateScrollbars() {
	updateVerticalScrollbar();
	updateHorizontalScrollbar();
	
	await tick();
	
	resize();
}

function updateVerticalScrollbar() {
	hasVerticalScrollbar = true; //
	
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
	if (!$prefs.wrap) {
		hasHorizontalScrollbar = false;
		
		return;
	}
	
	hasHorizontalScrollbar = true;
	
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
	
	redraw();
}

function horizontalScroll({detail: position}) {
	let {colWidth} = measurements;
	let {offsetWidth: width} = canvasDiv;
	
	let longestLineWidth = document.getLongestLineWidth();
	let scrollWidth = longestLineWidth * colWidth + width;
	let scrollMax = scrollWidth - width;
	
	let scrollLeft = scrollMax * position;
	
	scrollPosition.x = scrollLeft;
	
	redraw();
}

onMount(async function() {
	context = canvas.getContext("2d");
	
	document.parse($prefs);
	
	updateMeasurements();
	
	resize();
	updateScrollbars();
	startCursorBlink();
	redraw();
	
	let teardown = [];
	
	teardown.push(document.on("edit", function() {
		// TODO perf
		
		document.parse($prefs);
		
		document.wrapLines(
			$prefs,
			measurements,
			canvas.width - calculateMarginOffset(document.lines, measurements),
		);
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
	grid-template-columns: 1fr 0;
	grid-template-areas: "canvas verticalScrollbar" "horizontalScrollbar blank";
	flex-grow: 1;
	width: 100%;
	color: black;
	
	&.hasVerticalScrollbar {
		grid-template-columns: 1fr 13px;
	}
	
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
	class:hasVerticalScrollbar
	class:hasHorizontalScrollbar
>
	<div
		id="canvas"
		bind:this={canvasDiv}
	>
		<canvas
			bind:this={canvas}
			on:mousedown={mousedown}
			on:mouseup={mouseup}
			on:mousemove={mousemove}
			style={inlineStyle(canvasStyle)}
		/>
	</div>
	<div
		class="scrollbar"
		class:hide={!hasVerticalScrollbar}
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
	{#if hasVerticalScrollbar && hasHorizontalScrollbar}
		<div id="scrollbarSpacer"></div>
	{/if}
</div>

<div id="measurements" bind:this={measurementsDiv}></div>
