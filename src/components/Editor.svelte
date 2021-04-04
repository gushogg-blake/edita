<script>
import calculateMarginOffset from "../modules/render/calculateMarginOffset";
import render from "../modules/render/render";
import cursorFromScreenCoords from "../modules/utils/cursorFromScreenCoords";
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

let canvasDiv;
let measurementsDiv;
let canvas;
let context;
let measurements;
let rowHeightPadding = 2;
let rowBaselineHint = -1;

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
	
	selection.start = [lineIndex, offset];
	selection.end = [lineIndex, offset];
	
	startCursorBlink();
	
	redraw();
}

function mousemove(e) {
	//console.log(e);
}

function mouseup(e) {
	//console.log(e);
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

onMount(async function() {
	context = canvas.getContext("2d");
	
	console.time("parse");
	
	document.parse($prefs);
	
	console.timeEnd("parse");
	
	updateMeasurements();
	resize();
	startCursorBlink();
	redraw();
});

$: canvasStyle = {
	cursor: "text",
};
</script>

<svelte:window on:resize={resize}/>

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
