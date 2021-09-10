<script>
import {tick, onMount, getContext} from "svelte";

import inlineStyle from "utils/dom/inlineStyle";
import windowFocus from "utils/dom/windowFocus";
import getKeyCombo from "utils/getKeyCombo";

import render from "./canvas/render";

import normalMouse from "./normalMouse";
import astMouse from "./astMouse";
import modeSwitchKey from "./modeSwitchKey";
import contextMenu from "./contextMenu";

import Scrollbar from "./Scrollbar.svelte";
import InteractionLayer from "./InteractionLayer.svelte";

export let editor;

let {
	document,
	view,
} = editor;

let app = getContext("app"); //

let revisionCounter = 0;
let mounted = false;
let main;
let canvasDiv;
let measurementsDiv;
let canvases = {};
let contexts = {};
let rowHeightPadding = 2;
let rowBaselineHint = -1;

let resizeInterval;

let verticalScrollbar;
let horizontalScrollbar;
let showingHorizontalScrollbar = !platform.prefs.wrap;

let windowHasFocus;

let switchToAstModeOnMouseUp = false;
let isDragging = false;
let mouseIsDown = false;
let lastMouseEvent;

let normalMouseHandler = normalMouse(document, editor, view, {
	get canvasDiv() {
		return canvasDiv;
	},
	
	get showingHorizontalScrollbar() {
		return showingHorizontalScrollbar;
	},
	
	mouseup() {
		mouseIsDown = false;
		
		if (switchToAstModeOnMouseUp) {
			switchToAstMode();
			
			view.redraw();
			
			switchToAstModeOnMouseUp = false;
		}
	},
});

let astMouseHandler = astMouse(document, editor, view, {
	get canvasDiv() {
		return canvasDiv;
	},
	
	get showingHorizontalScrollbar() {
		return showingHorizontalScrollbar;
	},
	
	get isPeekingAstMode() {
		return modeSwitchKeyHandler.isPeeking;
	},
	
	showMenu(e, items) {
		contextMenu(e, items);
	},
	
	mouseup() {
		mouseIsDown = false;
	},
});

let modeSwitchKeyHandler = modeSwitchKey(view, {
	switchToAstMode() {
		if (mouseIsDown) {
			switchToAstModeOnMouseUp = true;
			
			return;
		}
		
		switchToAstMode();
		
		view.redraw();
	},
	
	switchToNormalMode() {
		switchToNormalMode();
		
		view.redraw();
	},
});

function mousedown({detail}) {
	let {
		e,
		option,
		enableDrag,
	} = detail;
	
	if (e.button === 0) {
		mouseIsDown = true;
	}
	
	if (view.mode === "normal") {
		normalMouseHandler.mousedown(e, function() {
			enableDrag(false);
		});
	} else if (view.mode === "ast") {
		astMouseHandler.mousedown(e, option, function() {
			// if we're holding the Esc key down to peek AST mode, use synthetic
			// drag as native will be canceled by the repeated keydown events
			// (unless another key has been pressed while Esc is down, which
			// cancels the repeat)
			
			enableDrag(
				modeSwitchKeyHandler.isPeeking
				&& !modeSwitchKeyHandler.keyPressedWhilePeeking
				&& platform.prefs.modeSwitchKey === "Escape"
			);
		});
	}
}

function mousemove({detail: e}) {
	if (isDragging) {
		return;
	}
	
	lastMouseEvent = e;
	
	if (view.mode === "normal") {
		normalMouseHandler.mousemove(e);
	} else if (view.mode === "ast") {
		astMouseHandler.mousemove(e);
	}
}

function mouseenter({detail: e}) {
	if (isDragging) {
		return;
	}
	
	if (view.mode === "normal") {
		normalMouseHandler.mouseenter(e);
	} else if (view.mode === "ast") {
		astMouseHandler.mouseenter(e);
	}
}

function mouseleave({detail: e}) {
	if (isDragging) {
		return;
	}
	
	if (view.mode === "normal") {
		normalMouseHandler.mouseleave(e);
	} else if (view.mode === "ast") {
		astMouseHandler.mouseleave(e);
	}
}

function mouseup({detail: e}) {
	mouseIsDown = false;
}

function click({detail: e}) {
	if (view.mode === "normal") {
		normalMouseHandler.click(e);
	} else if (view.mode === "ast") {
		astMouseHandler.click(e);
	}
}

function dblclick(e) {
	if (view.mode === "normal") {
		normalMouseHandler.dblclick(e);
	} else if (view.mode === "ast") {
		astMouseHandler.dblclick(e);
	}
}

function optionhover({detail}) {
	let {
		e,
		option,
	} = detail;
	
	astMouseHandler.optionhover(option, e);
}

function dragstart({detail}) {
	let {
		e,
		option,
	} = detail;
	
	isDragging = true;
	
	if (view.mode === "normal") {
		normalMouseHandler.dragstart(e);
	} else if (view.mode === "ast") {
		astMouseHandler.dragstart(e, option);
	}
	
	lastMouseEvent = e;
}

function dragover({detail}) {
	let {
		e,
		target,
	} = detail;
	
	if (view.mode === "normal") {
		normalMouseHandler.dragover(e);
	} else if (view.mode === "ast") {
		astMouseHandler.dragover(e, target);
	}
	
	lastMouseEvent = e;
}

function dragend({detail: e}) {
	isDragging = false;
	
	if (view.mode === "normal") {
		normalMouseHandler.dragend();
	} else if (view.mode === "ast") {
		astMouseHandler.dragend();
	}
	
	lastMouseEvent = e;
}

function dragenter({detail: e}) {
	if (view.mode === "normal") {
		normalMouseHandler.dragenter(e);
	} else if (view.mode === "ast") {
		astMouseHandler.dragenter(e);
	}
	
	lastMouseEvent = e;
}

function dragleave({detail: e}) {
	if (view.mode === "normal") {
		normalMouseHandler.dragleave(e);
	} else if (view.mode === "ast") {
		astMouseHandler.dragleave(e);
	}
	
	lastMouseEvent = e;
}

function drop({detail}) {
	let {
		e,
		fromUs,
		toUs,
		extra,
	} = detail;
	
	if (view.mode === "normal") {
		normalMouseHandler.drop(e, fromUs, toUs, extra);
	} else if (view.mode === "ast") {
		astMouseHandler.drop(e, fromUs, toUs, extra);
	}
	
	lastMouseEvent = e;
}

function wheel(e) {
	if (e.ctrlKey || e.altKey) {
		return;
	}
	
	e.stopPropagation();
	
	let dir = e.deltaY > 0 ? 1 : -1;
	
	if (e.shiftKey) {
		view.scrollBy(view.measurements.colWidth * 3 * dir, 0);
	} else {
		view.scrollBy(0, 3 * dir);
	}
}

async function keydown(e) {
	if (!view.focused) {
		return;
	}
	
	if (e.key === platform.prefs.modeSwitchKey) {
		e.preventDefault();
		
		modeSwitchKeyHandler.keydown(e);
		
		return;
	}
	
	let {keyCombo, isModified} = getKeyCombo(e);
	let {key} = e;
	
	if (view.mode === "normal") {
		if (editor.willHandleNormalKeydown(key, keyCombo, isModified)) {
			e.preventDefault();
			
			editor.normalKeydown(key, keyCombo, isModified);
		}
	} else if (view.mode === "ast") {
		if (editor.willHandleAstKeydown(keyCombo)) {
			e.preventDefault();
			
			editor.astKeydown(keyCombo);
		}
	}
}

function keyup(e) {
	if (!view.focused) {
		return;
	}
	
	if (e.key === platform.prefs.modeSwitchKey) {
		e.preventDefault();
		
		modeSwitchKeyHandler.keyup(e);
		
		return;
	}
}

function switchToAstMode() {
	if (mouseIsDown) {
		return;
	}
	
	view.switchToAstMode();
	view.redraw();
	
	astMouseHandler.updateHilites(lastMouseEvent);
}

function switchToNormalMode() {
	view.switchToNormalMode();
	view.redraw();
}

let prevWidth;
let prevHeight;

function resize() {
	if (!canvasDiv) {
		return;
	}
	
	if (!view.visible) {
		return;
	}
	
	let {
		offsetWidth: width,
		offsetHeight: height,
	} = canvasDiv;
	
	if (width !== prevWidth || height !== prevHeight) {
		for (let canvas of Object.values(canvases)) {
			canvas.width = width;
			canvas.height = height;
		}
		
		// setting width/height resets the context, so need to init the context here
		
		for (let context of Object.values(contexts)) {
			context.textBaseline = "bottom";
		}
		
		view.setCanvasSize(width, height);
		
		if (width !== prevWidth) {
			view.updateWrappedLines();
		}
		
		view.redraw();
		
		updateScrollbars();
		
		prevWidth = width;
		prevHeight = height;
	}
}

function updateCanvas() {
	render(
		contexts,
		view,
		modeSwitchKeyHandler.isPeeking,
		windowHasFocus,
	);
}

function updateScrollbars() {
	updateVerticalScrollbar();
	updateHorizontalScrollbar();
}

function redraw() {
	updateCanvas();
	updateScrollbars();
}

function updateVerticalScrollbar() {
	let {
		scrollPosition,
		measurements: {
			rowHeight,
		},
		sizes: {
			height,
		},
	} = view;
	
	let rows = view.countRows();
	
	let scrollHeight = (rows - 1) * rowHeight + height;
	let scrollTop = scrollPosition.row * rowHeight;
	let scrollMax = scrollHeight - height;
	let position = scrollTop / scrollMax;
	
	verticalScrollbar.update(scrollHeight, height, position);
}

function updateHorizontalScrollbar() {
	if (!showingHorizontalScrollbar) {
		return;
	}
	
	let {
		scrollPosition,
		measurements: {
			colWidth,
		},
		sizes: {
			codeWidth: width,
		},
	} = view;
	
	let longestLineWidth = document.getLongestLineWidth();
	
	let scrollWidth = longestLineWidth * colWidth + width;
	let scrollMax = scrollWidth - width;
	let scrollLeft = scrollPosition.x;
	let position = scrollLeft / scrollMax;
	
	horizontalScrollbar.update(scrollWidth, width, position);
}

function verticalScroll({detail: position}) {
	let {rowHeight} = view.measurements;
	let {height} = view.sizes;
	
	let rows = view.countRows();
	let scrollHeight = (rows - 1) * rowHeight + height;
	let scrollMax = scrollHeight - height;
	
	let scrollTop = scrollMax * position;
	let scrollRows = Math.round(scrollTop / rowHeight);
	
	view.setVerticalScroll(scrollRows);
	view.updateCanvas();
}

function horizontalScroll({detail: position}) {
	let {colWidth} = view.measurements;
	let {width} = view.sizes;
	
	let longestLineWidth = document.getLongestLineWidth();
	let scrollWidth = longestLineWidth * colWidth + width;
	let scrollMax = scrollWidth - width;
	
	let scrollLeft = scrollMax * position;
	
	view.setHorizontalScroll(scrollLeft);
	view.updateCanvas();
}

async function prefsUpdated() {
	await toggleHorizontalScrollbar(!platform.prefs.wrap);
	
	updateMeasurements();
	
	resize();
	
	view.updateWrappedLines();
	
	view.redraw();
}

function updateMeasurements() {
	measurementsDiv.style = inlineStyle({
		font: platform.prefs.font,
	});
	
	measurementsDiv.innerHTML = "A".repeat(10000);
	
	view.setMeasurements({
		colWidth: measurementsDiv.offsetWidth / measurementsDiv.innerHTML.length,
		rowHeight: measurementsDiv.offsetHeight + rowHeightPadding,
	});
}

async function toggleHorizontalScrollbar(show) {
	showingHorizontalScrollbar = show;
	
	await tick();
}

function onFocus() {
	view.focus();
}

function onEdit() {
	if (view.mode === "ast") {
		astMouseHandler.updateHilites(lastMouseEvent);
	}
}

onMount(function() {
	for (let [name, canvas] of Object.entries(canvases)) {
		contexts[name] = canvas.getContext("2d");
	}
	
	windowHasFocus = windowFocus.isFocused();
	
	updateMeasurements();
	
	view.startCursorBlink();
	
	resize();
	
	resizeInterval = setInterval(resize, 50);
	
	let teardown = [
		function() {
			clearInterval(resizeInterval);
		},
		
		view.on("show", function() {
			resize();
		}),
		
		view.on("updateCanvas", updateCanvas),
		
		view.on("updateScrollbars", updateScrollbars),
		
		view.on("requestFocus", function() {
			main.focus();
		}),
		
		editor.on("edit", onEdit),
		
		windowFocus.listen(function(isFocused) {
			windowHasFocus = isFocused;
			
			if (windowHasFocus) {
				view.startCursorBlink();
			}
			
			updateCanvas();
		}),
		
		platform.on("prefsUpdated", prefsUpdated),
	];
	
	mounted = true;
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<svelte:window
	on:keydown={keydown}
	on:keyup={keyup}
/>

<style type="text/scss">
@import "mixins/abs-sticky";
@import "classes/hide";

$scrollBarBorderWidth: 1px;
$scrollBarBorder: $scrollBarBorderWidth solid #bababa;

#main {
	color: black;
	display: grid;
	grid-template-rows: 1fr 0;
	grid-template-columns: 1fr calc(var(--scrollbarWidth) + #{$scrollBarBorderWidth});
	grid-template-areas: "canvas verticalScrollbar" "horizontalScrollbar spacer";
	width: 100%;
	height: 100%;
	background: white;
	
	&.showingHorizontalScrollbar {
		grid-template-rows: 1fr calc(var(--scrollbarWidth) + #{$scrollBarBorderWidth});
	}
}

#canvas {
	position: relative;
	grid-area: canvas;
	overflow: hidden;
}

.layer {
	@include abs-sticky;
	
	z-index: 1;
}

canvas {
	@include abs-sticky;
}

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
	grid-area: spacer;
	background: #E8E8E8;
}

#measurements {
	position: absolute;
	left: -9000px;
	top: -9000px;
}
</style>

<div
	bind:this={main}
	id="main"
	on:wheel={wheel}
	class:showingHorizontalScrollbar
	tabindex="0"
	on:focus={onFocus}
>
	<div
		id="canvas"
		bind:this={canvasDiv}
	>
		<div class="layer">
			<canvas bind:this={canvases.hilites}/>
		</div>
		<div class="layer">
			<canvas bind:this={canvases.code}/>
		</div>
		<div class="layer">
			<canvas bind:this={canvases.margin}/>
		</div>
		<div class="layer">
			<InteractionLayer
				{document}
				{editor}
				{view}
				on:mousedown={mousedown}
				on:mouseenter={mouseenter}
				on:mouseleave={mouseleave}
				on:mousemove={mousemove}
				on:mouseup={mouseup}
				on:click={click}
				on:dblclick={dblclick}
				on:optionhover={optionhover}
				on:dragstart={dragstart}
				on:dragover={dragover}
				on:dragend={dragend}
				on:dragenter={dragenter}
				on:dragleave={dragleave}
				on:drop={drop}
			/>
		</div>
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
		class:hide={!showingHorizontalScrollbar}
		id="horizontalScrollbar"
	>
		<Scrollbar
			bind:this={horizontalScrollbar}
			orientation="horizontal"
			on:scroll={horizontalScroll}
		/>
	</div>
	{#if showingHorizontalScrollbar}
		<div id="scrollbarSpacer"></div>
	{/if}
</div>

<div id="measurements" bind:this={measurementsDiv}></div>
