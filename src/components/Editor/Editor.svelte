<script lang="ts">
import {onMount} from "svelte";

import inlineStyle from "utils/dom/inlineStyle";
import windowFocus from "utils/dom/windowFocus";
import {on} from "utils/dom/domEvents";
import getKeyCombo from "utils/getKeyCombo";

import type {Editor} from "ui/editor";

import {getApp} from "components/context";

import {CanvasRenderer} from "./canvas";

import type {Canvases, Contexts} from ".";

import {astDragData} from "./mouseEvents";
import normalMouse from "./normalMouse";
import astMouse from "./astMouse";
import marginMouse from "./marginMouse";
import wheelHandler from "./wheelHandler";

import Scrollbar from "./Scrollbar.svelte";
import InteractionLayer from "./InteractionLayer/InteractionLayer.svelte";

type EditorProps = {
	editor: Editor;
	mode?: "app" | "textarea";
	border?: boolean;
};

let {
	editor,
	mode: editorMode = "app",
	border = false,
}: EditorProps = $props();

export function setValue(value) {
	editor.setValue(value);
}

export function getValue() {
	return editor.document.string;
}

export function focus() {
	main.focus();
}

let app = getApp();

let {theme} = base;

let {
	document,
	view,
	modeSwitchKey,
} = editor;

let canvasRenderer: CanvasRenderer;

let revisionCounter = 0;
let mounted = false;
let main: HTMLDivElement = $state();
let canvasDiv: HTMLDivElement = $state();
let measurementsDiv: HTMLDivElement = $state();
let canvases = $state({}) as Canvases;
let contexts = {} as Contexts;

let rowHeightPadding = 2;

let verticalScrollbar: Scrollbar = $state();
let horizontalScrollbar: Scrollbar = $state();
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

let mouseHandler = normalMouseHandler;

function mousedown(e) {
	editor.mousedown();
	
	mouseHandler.mousedown(e);
}

function mousemove(e) {
	if (isDragging) {
		return;
	}
	
	lastMouseEvent = e.originalEvent;
	
	mouseHandler.mousemove(e);
}

function mouseenter(e) {
	if (isDragging) {
		return;
	}
	
	mouseHandler.mouseenter(e);
}

function mouseleave(e) {
	if (isDragging) {
		return;
	}
	
	mouseHandler.mouseleave(e);
}

function _mouseup(e) {
	editor.mouseup();
}

function mouseup(e) {
	_mouseup(e);
}

function click(e) {
	mouseHandler.click(e);
}

function dblclick(e) {
	mouseHandler.dblclick(e);
}

function contextmenu(e) {
	mouseHandler.contextmenu(e);
}

function middlepress(e) {
	mouseHandler.middlepress(e);
}

function dragstart(e) {
	isDragging = true;
	
	mouseHandler.dragstart(e);
	
	lastMouseEvent = e.originalEvent;
}

function dragover(e) {
	mouseHandler.dragover(e);
	
	lastMouseEvent = e.originalEvent;
}

function dragend(e) {
	isDragging = false;
	
	mouseHandler.dragend(e);
	
	lastMouseEvent = e.originalEvent;
}

function dragenter(e) {
	if (view.mode === "normal" && astDragData.get(e.originalEvent)) {
		editor.switchToAstMode();
		
		inAstModeForDrop = true;
	}
	
	mouseHandler.dragenter(e);
	
	lastMouseEvent = e.originalEvent;
}

function dragleave(e) {
	mouseHandler.dragleave(e);
	
	if (inAstModeForDrop) {
		editor.switchToNormalMode();
		
		inAstModeForDrop = false;
	}
	
	lastMouseEvent = e.originalEvent;
}

function drop(e) {
	mouseHandler.drop(e);
	
	if (inAstModeForDrop) {
		editor.switchToNormalMode();
		
		inAstModeForDrop = false;
	}
	
	if (!e.fromUs) {
		view.requestFocus();
	}
	
	lastMouseEvent = e.originalEvent;
}

function marginMousedown(e) {
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
		
		view.startSyncRedrawBatch();
		view.setCanvasSize(width, height);
		view.endSyncRedrawBatch();
		
		updateScrollbars();
		
		prevWidth = width;
		prevHeight = height;
	}
}

function resizeAsync() {
	requestAnimationFrame(resize);
}

function updateCanvas() {
	canvasRenderer.render({
		isPeekingAstMode: modeSwitchKey.isPeeking,
		windowHasFocus,
	});
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

function verticalScroll(position) {
	view.setVerticalScrollPosition(position);
}

function horizontalScroll(position) {
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
}

function onModeSwitch() {
	mouseHandler = view.mode === "ast" ? astMouseHandler : normalMouseHandler;
}

onMount(function() {
	mounted = true;
	
	for (let [name, canvas] of Object.entries(canvases)) {
		contexts[name] = canvas.getContext("2d");
	}
	
	canvasRenderer = new CanvasRenderer(contexts, view);
	
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
				{editor}
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
