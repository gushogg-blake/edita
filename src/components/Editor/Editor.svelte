<script>
import {onMount} from "svelte";
//import sleep from "../../utils/sleep";
import inlineStyle from "../../utils/inlineStyle";
import render from "./render";

export let prefs;
export let document;

let main;
let measurementsDiv;
let canvas;
let c;
let measurements;
let margin;

let marginMargin = 1; // 1px gap between margin and text
let marginPaddingLeft = 3;
let marginPaddingRight = 5;

let coordsXHint = 2;

let desiredScroll = {
	topLine: 0,
	x: 0,
};

let scrollPosition = {
	tokenIndex: 0,
	x: 0,
};

function mousedown(e) {
	let {
		charWidth,
		lineHeight,
	} = measurements;
	
	let {
		x: left,
		y: top,
	} = canvas.getBoundingClientRect();
	
	let x = e.clientX - left - margin.widthPlusGap + scrollPosition.x + coordsXHint;
	let y = e.clientY - top;
	
	let cursorCol = Math.round(x / charWidth);
	
	let screenLine = Math.floor(y / lineHeight);
	
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
		let newX = Math.round(scrollPosition.x + measurements.charWidth * 3 * dir);
		
		newX = Math.max(0, newX);
		
		scrollPosition.x = newX;
	} else {
		let newTopLine = desiredScroll.topLine + 3 * dir;
		
		newTopLine = Math.max(0, newTopLine);
		newTopLine = Math.min(document.countLines + 1, newTopLine);
		
		desiredScroll.topLine = newTopLine;
		
		scrollPosition.tokenIndex = document.tokenIndexAtVisualLine(desiredScroll.topLine);
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
	
	c.textBaseline = "bottom";
	
	redraw();
}

function redraw() {
	render(
		c,
		prefs,
		document,
		measurements,
		margin,
		scrollPosition,
	);
}

//function renderLoop() {
//	redraw();
//	requestAnimationFrame(renderLoop);
//}

function updateMeasurements() {
	measurementsDiv.style = inlineStyle({
		font: prefs.font,
	});
	
	measurementsDiv.innerHTML = "A".repeat(100);
	
	measurements = {
		charWidth: measurementsDiv.offsetWidth / measurementsDiv.innerHTML.length,
		lineHeight: measurementsDiv.offsetHeight,
	};
}

function updateMargin() {
	let overallWidth = (
		Math.round(measurements.charWidth * ("" + document.countLines).length)
		+ marginPaddingLeft
		+ marginPaddingRight
	);

	margin = {
		overallWidth,
		widthPlusGap: overallWidth + marginMargin,
		paddingLeft: marginPaddingLeft,
		paddingRight: marginPaddingRight,
	};
}

onMount(async function() {
	c = canvas.getContext("2d");
	
	document.tokenise(prefs);
	
	updateMeasurements();
	updateMargin();
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
