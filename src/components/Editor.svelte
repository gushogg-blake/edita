<script>
import langs from "../modules/langs";
import render from "../modules/render/render";
import calculateMarginOffset from "../modules/render/calculateMarginOffset";
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
export let lang;

let canvasDiv;
let measurementsDiv;
let canvas;
let context;
let measurements;
let coordsXHint = 2;
let rowHeightPadding = 2;
let rowBaselineHint = -1;

let selection = {
	start: [0, 0],
	end: [0, 0],
};

let scrollPosition = {
	row: 0,
	col: 0,
};

let hiliteWord = null;

function mousedown(e) {
	let {
		colWidth,
		rowHeight,
	} = measurements;
	
	let {
		x: left,
		y: top,
	} = canvas.getBoundingClientRect();
	
	let marginOffset = calculateMarginOffset(document.lines, measurements);
	let x = e.clientX - left - marginOffset + scrollPosition.col + coordsXHint;
	let y = e.clientY - top;
	
	let cursorCol = Math.round(x / colWidth);
	
	let screenLine = Math.floor(y / rowHeight);
	
	console.log(screenLine, cursorCol);
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
		let newCol = Math.round(scrollPosition.col + measurements.colWidth * 3 * dir);
		
		newCol = Math.max(0, newCol);
		
		scrollPosition.col = newCol;
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
	
	redraw();
}

function redraw() {
	let now = Date.now();
	
	render(
		context,
		document.lines,
		selection,
		hiliteWord,
		scrollPosition,
		langs[lang],
		$prefs,
		$prefs.langs[lang].colors,
		measurements,
		(now - now % 800) % 2 === 0,
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
	
	langs[lang].parse($prefs, document.lines);
	
	console.timeEnd("parse");
	
	updateMeasurements();
	resize();
	redraw();
	
	setInterval(redraw, 800);
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
