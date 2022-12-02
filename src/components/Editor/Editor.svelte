<script>
import {onMount, getContext} from "svelte";

import inlineStyle from "utils/dom/inlineStyle";
import windowFocus from "utils/dom/windowFocus";
import getKeyCombo from "utils/getKeyCombo";

import render from "./canvas/render";

import normalMouse from "./normalMouse";
import astMouse from "./astMouse";
import wheelHandler from "./wheelHandler";

import Scrollbar from "./Scrollbar.svelte";
import InteractionLayer from "./InteractionLayer.svelte";

/*
there are two general modes this component can run in - as a frontend to
an existing Editor that's managed by the app (ie. a tab for editing/creating
a file) ("app") or as essentially a fancy textarea ("textarea") (in which
case it creates its own Editor).

the point of this is to allow it to be used as a textarea with just
bind:value as opposed to having to create a Document, a View, and an Editor.

lang is for setting the language in textarea mode, where there isn't a file
to guess the language from.
*/

export let editor = null;
export let value = ""; // readonly - call setValue to set
export let lang = null;

export function setValue(value) {
	editor.setValue(value);
}

export function focus() {
	main.focus();
}

let app = getContext("app");

let editorMode = editor ? "app" : "textarea";

if (editorMode === "textarea") {
	editor = base.createEditorForTextArea(value);
	
	if (lang) {
		editor.document.setLang(base.langs.get(lang));
	}
}

let {theme} = base;

let {
	document,
	view,
	modeSwitchKey,
} = editor;

let revisionCounter = 0;
let mounted = false;
let main;
let canvasDiv;
let measurementsDiv;
let canvases = {};
let contexts = {};
let rowHeightPadding = 2;

let resizeInterval;

let verticalScrollbar;
let horizontalScrollbar;
let showingHorizontalScrollbar = !view.wrap;

let windowHasFocus;

let isDragging = false;
let lastMouseEvent;

let normalMouseHandler = normalMouse(editor, {
	get canvasDiv() {
		return canvasDiv;
	},
	
	get showingHorizontalScrollbar() {
		return showingHorizontalScrollbar;
	},
	
	mouseup: _mouseup,
});

let astMouseHandler = astMouse(editor, {
	get app() {
		return app;
	},
	
	get canvasDiv() {
		return canvasDiv;
	},
	
	get showingHorizontalScrollbar() {
		return showingHorizontalScrollbar;
	},
	
	mouseup: _mouseup,
});

let _wheelHandler = wheelHandler(editor, {
	get canvasDiv() {
		return canvasDiv;
	},
	
	get editorMode() {
		return editorMode;
	},
});

function mousedown({detail}) {
	let {
		e,
		isDoubleClick,
		pickOptionType,
		enableDrag,
	} = detail;
	
	editor.mousedown();
	
	if (view.mode === "normal") {
		normalMouseHandler.mousedown(e, function() {
			enableDrag(isDoubleClick);
		});
	} else if (view.mode === "ast") {
		astMouseHandler.mousedown(e, pickOptionType, function() {
			enableDrag(
				isDoubleClick
				|| (
					modeSwitchKey.isPeeking
					&& !modeSwitchKey.keyPressedWhilePeeking
					&& base.prefs.modeSwitchKey === "Escape"
				)
			);
		});
	}
}

function mousemove({detail: {e, pickOptionType}}) {
	if (isDragging) {
		return;
	}
	
	lastMouseEvent = e;
	
	if (view.mode === "normal") {
		normalMouseHandler.mousemove(e);
	} else if (view.mode === "ast") {
		astMouseHandler.mousemove(e, pickOptionType);
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

function _mouseup(e) {
	editor.mouseup();
}

function mouseup({detail: e}) {
	_mouseup(e);
}

function click({detail: {e, pickOptionType}}) {
	if (view.mode === "normal") {
		normalMouseHandler.click(e);
	} else if (view.mode === "ast") {
		astMouseHandler.click(e, pickOptionType);
	}
}

function dblclick({detail: e}) {
	if (view.mode === "normal") {
		normalMouseHandler.dblclick(e);
	} else if (view.mode === "ast") {
		astMouseHandler.dblclick(e);
	}
}

function dragstart({detail: {e, pickOptionType}}) {
	isDragging = true;
	
	if (view.mode === "normal") {
		normalMouseHandler.dragstart(e);
	} else if (view.mode === "ast") {
		astMouseHandler.dragstart(e, pickOptionType);
	}
	
	lastMouseEvent = e;
}

function dragover({detail: {e, dropTargetType}}) {
	if (view.mode === "normal") {
		normalMouseHandler.dragover(e);
	} else if (view.mode === "ast") {
		astMouseHandler.dragover(e, dropTargetType);
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
	
	if (!fromUs) {
		view.requestFocus();
	}
	
	lastMouseEvent = e;
}

function wheel(e) {
	_wheelHandler.wheel(e);
}

// ENTRYPOINT key press on the Editor (handler installed on main div below)

async function keydown(e) {
	if (editorMode === "textarea" && e.key === "Escape") {
		main.blur();
		
		return;
	}
	
	if (e.key === base.prefs.modeSwitchKey) {
		e.preventDefault();
		
		modeSwitchKey.keydown(e);
		
		return;
	}
	
	let {keyCombo, isModified} = getKeyCombo(e);
	let {key} = e;
	
	if (view.mode === "normal" && editor.willHandleNormalKeydown(key, keyCombo, isModified)) {
		e.preventDefault();
		
		editor.normalKeydown(key, keyCombo, isModified);
	} else if (view.mode === "ast" && editor.willHandleAstKeydown(keyCombo)) {
		e.preventDefault();
		
		editor.astKeydown(keyCombo);
	} else if (editor.willHandleCommonKeydown(keyCombo)) {
		e.preventDefault();
		
		editor.commonKeydown(keyCombo);
	}
}

let prevWidth;
let prevHeight;

function resize() {
	if (!mounted) {
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
		
		view.startBatch();
		
		view.setCanvasSize(width, height);
		
		if (width !== prevWidth) {
			view.updateWrappedLines();
		}
		
		view.endBatch();
		
		updateScrollbars();
		
		prevWidth = width;
		prevHeight = height;
	}
}

function resizeAsync() {
	requestAnimationFrame(resize);
}

function updateCanvas() {
	render(
		contexts,
		view,
		modeSwitchKey.isPeeking,
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
		sizes: {height},
	} = view;
	
	let scrollHeight = view.getScrollHeight();
	let scrollTop = scrollPosition.y;
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
		sizes: {codeWidth: width},
	} = view;
	
	let scrollWidth = view.getScrollWidth();
	let scrollMax = scrollWidth - width;
	let scrollLeft = scrollPosition.x;
	let position = scrollLeft / scrollMax;
	
	horizontalScrollbar.update(scrollWidth, width, position);
}

function verticalScroll({detail: position}) {
	let {height} = view.sizes;
	
	let scrollHeight = view.getScrollHeight();
	let scrollMax = scrollHeight - height;
	
	let scrollTop = Math.round(scrollMax * position);
	
	view.setVerticalScrollNoValidate(scrollTop);
}

function horizontalScroll({detail: position}) {
	let {width} = view.sizes;
	
	let scrollWidth = view.getScrollWidth();
	let scrollMax = scrollWidth - width;
	
	let scrollLeft = Math.round(scrollMax * position);
	
	view.setHorizontalScrollNoValidate(scrollLeft);
}

async function onWrapChanged() {
	await toggleHorizontalScrollbar(!view.wrap);
}

function updateMeasurements() {
	if (!mounted) {
		return;
	}
	
	let {
		fontFamily,
		fontSize,
	} = theme.editor;
	
	measurementsDiv.style = inlineStyle({
		fontFamily,
		fontSize,
	});
	
	measurementsDiv.innerHTML = "A".repeat(10000);
	
	view.setMeasurements({
		colWidth: measurementsDiv.offsetWidth / measurementsDiv.innerHTML.length,
		rowHeight: measurementsDiv.offsetHeight + rowHeightPadding,
	});
}

function toggleHorizontalScrollbar(show) {
	showingHorizontalScrollbar = show;
	
	resizeAsync();
}

function onThemeUpdated() {
	({theme} = base);
	
	updateMeasurements();
	redraw();
}

function onFocus() {
	view.focus();
}

function onBlur() {
	view.blur();
}

async function onEdit() {
	if (view.mode === "ast") {
		astMouseHandler.updateHilites(lastMouseEvent);
	}
	
	if (editorMode === "textarea") {
		value = document.string;
	}
}

function onModeSwitch() {
	if (view.mode === "ast") {
		//astMouseHandler.updateHilites(lastMouseEvent);
	}
}

onMount(function() {
	mounted = true;
	
	for (let [name, canvas] of Object.entries(canvases)) {
		contexts[name] = canvas.getContext("2d");
	}
	
	windowHasFocus = windowFocus.isFocused();
	
	updateMeasurements();
	
	if (editorMode === "textarea") {
		view.show();
	}
	
	view.startCursorBlink();
	
	resize();
	
	resizeInterval = setInterval(resize, 50);
	
	let teardown = [
		function() {
			clearInterval(resizeInterval);
		},
		
		base.on("themeUpdated", onThemeUpdated),
		
		view.on("show", resize),
		view.on("requestResizeAsync", resizeAsync),
		view.on("updateCanvas", updateCanvas),
		view.on("updateScrollbars", updateScrollbars),
		view.on("wrapChanged", onWrapChanged),
		view.on("modeSwitch", onModeSwitch),
		
		view.on("requestFocus", function() {
			main.focus({
				preventScroll: true,
			});
		}),
		
		editor.on("edit", onEdit),
		
		windowFocus.listen(function(isFocused) {
			windowHasFocus = isFocused;
			
			if (!view.visible) {
				return;
			}
			
			if (windowHasFocus) {
				view.startCursorBlink();
			}
			
			updateCanvas();
		}),
	];
	
	view.uiMounted();
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<svelte:window on:resize={resize}/>

<style lang="scss">
@import "mixins/abs-sticky";
@import "classes/hide";

#main {
	position: relative;
	display: grid;
	grid-template-rows: 1fr 0;
	grid-template-columns: 1fr auto;
	grid-template-areas: "canvas verticalScrollbar" "horizontalScrollbar spacer";
	width: 100%;
	height: 100%;
	overflow: hidden;
	
	&.showingHorizontalScrollbar {
		grid-template-rows: 1fr auto;
	}
}

#canvas {
	position: relative;
	grid-area: canvas;
	overflow: hidden;
}

.layer {
	@include abs-sticky;
	
	//z-index: 1;
}

canvas {
	@include abs-sticky;
}

#verticalScrollbar {
	position: relative;
	grid-area: verticalScrollbar;
	border-left: var(--scrollbarBorder);
}

#horizontalScrollbar {
	position: relative;
	grid-area: horizontalScrollbar;
	border-top: var(--scrollbarBorder);
}

#scrollbarSpacer {
	grid-area: spacer;
	background: var(--scrollbarSpacerBackground);
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
	class="treefrog"
	class:showingHorizontalScrollbar
	tabindex="0"
	on:focus={onFocus}
	on:blur={onBlur}
	on:keydown={keydown}
>
	<div
		id="canvas"
		bind:this={canvasDiv}
	>
		<div class="layer">
			<canvas bind:this={canvases.background}/>
		</div>
		<div class="layer">
			<canvas bind:this={canvases.foldHilites}/>
		</div>
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
	<div id="measurements" bind:this={measurementsDiv}></div>
</div>
