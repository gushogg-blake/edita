<script lang="ts">
import {onMount, getContext} from "svelte";

import inlineStyle from "utils/dom/inlineStyle";
import windowFocus from "utils/dom/windowFocus";
import {on} from "utils/dom/domEvents";
import getKeyCombo from "utils/getKeyCombo";

import render from "./canvas/render";

import normalMouse from "./normalMouse";
import astMouse from "./astMouse";
import marginMouse from "./marginMouse";
import wheelHandler from "./wheelHandler";
import astDragData from "./astDragData";

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

let {
	editor = $bindable(null),
	value = $bindable(""),
	lang = null,
	border = false,
} = $props();

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
let main = $state();
let canvasDiv = $state();
let measurementsDiv = $state();
let canvases = $state({});
let contexts = {};
let rowHeightPadding = 2;

let verticalScrollbar = $state();
let horizontalScrollbar = $state();
let showingHorizontalScrollbar = $state(!view.wrap);

let windowHasFocus;

let isDragging = false;
let lastMouseEvent;
let inAstModeForDrop = false;

let normalMouseHandler = normalMouse(editor, {
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

let marginMouseHandler = marginMouse(editor, {
	get canvasDiv() {
		return canvasDiv;
	},
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
		normalMouseHandler.mousedown(e, isDoubleClick, enableDrag);
	} else if (view.mode === "ast") {
		astMouseHandler.mousedown(e, pickOptionType, function() {
			enableDrag(
				modeSwitchKey.isPeeking
				&& !modeSwitchKey.keyPressedWhilePeeking
				&& base.prefs.modeSwitchKey === "Escape"
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

function contextmenu({detail: {e, pickOptionType}}) {
	if (view.mode === "normal") {
		normalMouseHandler.contextmenu(e, pickOptionType);
	} else if (view.mode === "ast") {
		astMouseHandler.contextmenu(e, pickOptionType);
	}
}

function middlepress({detail: {e, pickOptionType}}) {
	if (view.mode === "normal") {
		normalMouseHandler.middlepress(e, pickOptionType);
	} else if (view.mode === "ast") {
		astMouseHandler.middlepress(e, pickOptionType);
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
	if (view.mode === "normal" && astDragData.get(e)) {
		editor.switchToAstMode();
		
		inAstModeForDrop = true;
	}
	
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
	
	if (inAstModeForDrop) {
		editor.switchToNormalMode();
		
		inAstModeForDrop = false;
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
	
	if (inAstModeForDrop) {
		editor.switchToNormalMode();
		
		inAstModeForDrop = false;
	}
	
	if (!fromUs) {
		view.requestFocus();
	}
	
	lastMouseEvent = e;
}

function marginMousedown({detail: e}) {
	marginMouseHandler.mousedown(e);
}

function wheel(e) {
	_wheelHandler.wheel(e);
}

// ENTRYPOINT key press on the Editor (handler installed on main div below)

function keydown(e) {
	if (editorMode === "textarea" && e.key === "Escape") {
		main.blur();
		
		return;
	}
	
	if (e.key === base.prefs.modeSwitchKey) {
		e.preventDefault();
		
		modeSwitchKey.keydown(e);
		
		return;
	}
	
	if (base.getPref("dev.timing.keydown")) {
		console.time("keydown");
	}
	
	let {keyCombo, isModified} = getKeyCombo(e);
	let {key} = e;
	
	if (view.mode === "normal" && editor.willHandleNormalKeydown(key, keyCombo, isModified)) {
		e.preventDefault();
		
		//if (base.getPref("dev.timing.keydown")) {
		//	console.time("keydown");
		//}
		
		editor.normalKeydown(key, keyCombo, isModified);
		
		//if (base.getPref("dev.timing.keydown")) {
		//	console.timeEnd("keydown");
		//}
	} else if (view.mode === "ast" && editor.willHandleAstKeydown(keyCombo)) {
		e.preventDefault();
		
		editor.astKeydown(keyCombo);
	} else if (editor.willHandleCommonKeydown(keyCombo)) {
		e.preventDefault();
		
		editor.commonKeydown(keyCombo);
	}
	
	if (base.getPref("dev.timing.keydown")) {
		console.timeEnd("keydown");
	}
}

function keyup(e) {
	editor.keyup();
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
		let {devicePixelRatio} = window;
		
		for (let canvas of Object.values(canvases)) {
			canvas.width = width * devicePixelRatio;
			canvas.height = height * devicePixelRatio;
			canvas.style.width = width + "px";
			canvas.style.height = height + "px";
		}
		
		// setting width/height resets the context, so need to init the context here
		
		for (let context of Object.values(contexts)) {
			context.scale(devicePixelRatio, devicePixelRatio);
			
			context.textBaseline = "bottom";
		}
		
		view.startBatch();
		
		view.setCanvasSize(width, height);
		
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
	view.setVerticalScrollPosition(position);
}

function horizontalScroll({detail: position}) {
	view.setHorizontalScrollPosition(position);
}

function onWrapChanged() {
	toggleHorizontalScrollbar(!view.wrap);
}

let lastMeasurements;

function updateMeasurements() {
	if (!mounted) {
		return;
	}
	
	let {
		fontFamily,
		fontSize,
	} = theme.editor;
	
	if (lastMeasurements && fontFamily === lastMeasurements.fontFamily && fontSize === lastMeasurements.fontSize) {
		return;
	}
	
	measurementsDiv.style = inlineStyle({
		fontFamily,
		fontSize,
	});
	
	measurementsDiv.innerHTML = "A".repeat(10000);
	
	view.setMeasurements({
		colWidth: measurementsDiv.offsetWidth / measurementsDiv.innerHTML.length,
		rowHeight: measurementsDiv.offsetHeight + rowHeightPadding,
	});
	
	lastMeasurements = {
		fontFamily,
		fontSize,
	};
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

function onEdit() {
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
	
	let teardown = [
		base.on("themeUpdated", onThemeUpdated),
		
		app?.on("resize", resizeAsync) || on(window, "resize", resizeAsync),
		
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
		mounted = false;
		
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
@use "utils";

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
	
	&.border {
		border: var(--inputBorder);
		border-radius: var(--inputBorderRadius);
	}
}

#canvas {
	position: relative;
	grid-area: canvas;
	overflow: hidden;
}

.layer {
	@include utils.abs-sticky;
	
	//z-index: 1;
}

canvas {
	@include utils.abs-sticky;
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
	onwheel={wheel}
	class="edita"
	class:showingHorizontalScrollbar
	class:border
	tabindex="0"
	onfocus={onFocus}
	onblur={onBlur}
	onkeydown={keydown}
>
	<div
		id="canvas"
		bind:this={canvasDiv}
	>
		<div class="layer">
			<canvas bind:this={canvases.background}></canvas>
		</div>
		<div class="layer">
			<canvas bind:this={canvases.foldHilites}></canvas>
		</div>
		<div class="layer">
			<canvas bind:this={canvases.hilites}></canvas>
		</div>
		<div class="layer">
			<canvas bind:this={canvases.code}></canvas>
		</div>
		<div class="layer">
			<canvas bind:this={canvases.margin}></canvas>
		</div>
		<div class="layer">
			<InteractionLayer
				{document}
				{editor}
				{view}
				onmousedown={mousedown}
				onmouseenter={mouseenter}
				onmouseleave={mouseleave}
				onmousemove={mousemove}
				onmouseup={mouseup}
				oncontextmenu={contextmenu}
				onmiddlepress={middlepress}
				onclick={click}
				ondblclick={dblclick}
				ondragstart={dragstart}
				ondragover={dragover}
				ondragend={dragend}
				ondragenter={dragenter}
				ondragleave={dragleave}
				ondrop={drop}
				onmarginMousedown={marginMousedown}
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
			onscroll={verticalScroll}
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
			onscroll={horizontalScroll}
		/>
	</div>
	{#if showingHorizontalScrollbar}
		<div id="scrollbarSpacer"></div>
	{/if}
	<div id="measurements" bind:this={measurementsDiv}></div>
</div>
