<script>
import calculateMarginOffset from "../modules/render/calculateMarginOffset";
import render from "../modules/render/render";
import cursorFromScreenCoords from "../modules/utils/cursorFromScreenCoords";
import sortSelection from "../modules/utils/sortSelection";
import isFullSelection from "../modules/utils/isFullSelection";
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
		//newRow = Math.min(document.countLines + 1, newRow);
		
		scrollPosition.row = newRow;
	}
	
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
	
	let [lineIndex, offset] = sortSelection(selection).start;
	
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
}

function keyup(e) {
	if (!focused) {
		return;
	}
	
}

onMount(async function() {
	context = canvas.getContext("2d");
	
	document.parse($prefs);
	
	updateMeasurements();
	resize();
	startCursorBlink();
	redraw();
	
	let teardown = [];
	
	teardown.push(document.on("edit", function() {
		// TODO perf
		
		document.parse($prefs);
		
		document.wrapLines(
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

#main {
	display: grid;
	grid-template-rows: 1fr 0;
	grid-template-columns: 1fr 0;
	grid-template-areas: "canvas verticalScrollbar" "horizontalScrollbar blank";
	flex-grow: 1;
	width: 100%;
	color: black;
	
	&.hasVerticalScrollbar {
		grid-template-columns: 1fr 12px;
	}
	
	&.hasHorizontalScrollbar {
		grid-template-rows: 1fr 12px;
	}
}
/*
#canvasContainer {
	position: relative;
}
*/
#canvas {
	position: relative;
	grid-area: canvas;
	overflow: hidden;
}

canvas {
	@include abs-sticky;
	
	z-index: 1;
}

#verticalScrollbar {
	position: relative;
	grid-area: verticalScrollbar;
}

#horizontalScrollbar {
	position: relative;
	grid-area: horizontalScrollbar;
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
	<div class="scrollbar" id="verticalScrollbar">
		<Scrollbar
			orientation="vertical"
		/>
	</div>
	<div class="scrollbar" id="horizontalScrollbar">
		<Scrollbar
			orientation="horizontal"
		/>
	</div>
</div>

<div id="measurements" bind:this={measurementsDiv}></div>
