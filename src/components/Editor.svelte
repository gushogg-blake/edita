<script>
import calculateMarginOffset from "../modules/render/calculateMarginOffset";
import render from "../modules/render/render";
import cursorFromScreenCoords from "../modules/utils/cursorFromScreenCoords";
import sortSelection from "../modules/utils/sortSelection";
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

export let document;

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
	start: [14, 113],
	end: [22, 3],
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
	
	if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
		// printable character other than tab
		
		let [lineIndex, offset] = sortSelection(selection).start;
		
		document.replaceSelection(selection, e.key);
		
		selection = {
			start: [lineIndex, offset + 1],
			end: [lineIndex, offset + 1],
		};
		
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
	grid-template-rows: 1fr auto;
	grid-template-columns: 1fr auto;
	grid-template-areas: "canvas verticalScrollbar" "horizontalScrollbar blank";
	flex-grow: 1;
	width: 100%;
	color: black;
}

#canvas {
	position: relative;
	grid-area: canvas;
	overflow: hidden;
}

canvas {
	@include abs-sticky;
}

#verticalScrollbar {
	grid-area: verticalScrollbar;
	width: 12px;
	background: #EAEAEA;
}

#horizontalScrollbar {
	grid-area: horizontalScrollbar;
	height: 12px;
	background: #EAEAEA;
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
	<div id="verticalScrollbar">
		
	</div>
	<div id="horizontalScrollbar">
		
	</div>
</div>

<div id="measurements" bind:this={measurementsDiv}></div>
