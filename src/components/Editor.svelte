<script>
import js from "../modules/langs/js";
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

let main;
let measurementsDiv;
let canvas;
let context;
let measurements;
let coordsXHint = 2;

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
	let x = e.clientX - left - margin.widthPlusGap + scrollPosition.col + coordsXHint;
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
	canvas.width = main.offsetWidth;
	canvas.height = main.offsetHeight;
	
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
		$prefs.font,
		$prefs.langs[lang].colors,
		measurements,
		(now - now % 800) % 2 === 0,
	);
}

function updateMeasurements() {
	measurementsDiv.style = inlineStyle({
		font: prefs.font,
	});
	
	measurementsDiv.innerHTML = "A".repeat(100);
	
	measurements = {
		colWidth: measurementsDiv.offsetWidth / measurementsDiv.innerHTML.length,
		rowHeight: measurementsDiv.offsetHeight,
	};
}

onMount(async function() {
	context = canvas.getContext("2d");
	
	js($prefs, document.lines);
	
	updateMeasurements();
	resize();
	redraw();
});

$: canvasStyle = {
	cursor: "text",
};
</script>

<svelte:window on:resize={resize}/>

<style>
#main {
	flex-grow: 1;
	overflow: hidden;
	color: black;
}

#measurements {
	position: absolute;
	left: -9000px;
	top: -9000px;
}
</style>

<div
	id="main"
	bind:this={main}
	on:wheel={wheel}
>
	<canvas
		bind:this={canvas}
		on:mousedown={mousedown}
		on:mouseup={mouseup}
		on:mousemove={mousemove}
		style={inlineStyle(canvasStyle)}
	/>
</div>

<div id="measurements" bind:this={measurementsDiv}></div>
