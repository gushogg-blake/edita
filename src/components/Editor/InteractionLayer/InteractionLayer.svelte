<script lang="ts">
import {onMount} from "svelte";
import {unique} from "utils/array";
import {on, off} from "utils/dom/domEvents";
import inlineStyle from "utils/dom/inlineStyle";
import getDistanceBetweenMouseEvents from "utils/dom/getDistanceBetweenMouseEvents";
import drag from "./utils/drag";
import createDragEvent from "./utils/createDragEvent";
import AstMode from "./AstMode.svelte";
import Completions from "./Completions.svelte";

let {
	editor,
	onmiddlepress = () => {},
	ondblclick = () => {},
	onmousedown = () => {},
	onmousemove = () => {},
	onmouseup = () => {},
	onclick = () => {},
	onmarginMousedown = () => {},
	onmouseenter = () => {},
	onmouseleave = () => {},
	oncontextmenu = () => {},
	ondragstart = () => {},
	ondragover = () => {},
	ondragenter = () => {},
	ondragleave = () => {},
	ondrop = () => {},
	ondragend = () => {},
} = $props();

let {document, view} = editor;

let astModeComponent: AstMode = $state();
let interactionDiv: HTMLDivElement = $state();

let draggable = $state(false);
let useSyntheticDrag = $state();
let syntheticDrag = null;
let dragStartedHere = $state(false);
let isDragging = $state(false);

let lastMousedownWasDoubleClick = false;
let lastMousedownEvent;
let lastMousedownTime;
let lastClickMousedownEvent;
let lastClickMousedownTime;

let clickDistanceThreshold = 2;
let ignoreMouseLeave = false;

let {measurements, astMode} = view;

let mode = $state(view.mode);
let sizes = $state(view.sizes);
let rowHeight = $state(measurements.rowHeight);
let colWidth = $state(measurements.colWidth);

let syntheticDragHandler = drag({
	start(e) {
		syntheticDrag = {
			data: {},
			files: [],
			
			get types() {
				return Object.keys(this.data);
			},
			
			setData(type, data) {
				this.data[type] = data;
			},
			
			getData(type) {
				return this.data[type];
			},
			
			setDragImage() {
			},
		};
		
		interactionDiv.dispatchEvent(createDragEvent.dragstart(e, syntheticDrag));
		interactionDiv.dispatchEvent(createDragEvent.dragenter(e, syntheticDrag));
	},
	
	move(e, x, y) {
		interactionDiv.dispatchEvent(createDragEvent.dragover(e, syntheticDrag));
	},
	
	end(e) {
		if (window.document.elementsFromPoint(e.pageX, e.pageY).includes(interactionDiv)) {
			interactionDiv.dispatchEvent(createDragEvent.drop(e, syntheticDrag));
		}
		
		interactionDiv.dispatchEvent(createDragEvent.dragend(e, syntheticDrag));
		
		syntheticDrag = null;
	},
	
	click,
});

function mousedown(e) {
	if (e.button === 2) {
		/*
		opening the context menu causes a mouseleave, so ignore the next one
		*/
		
		if (e.button === 2) {
			ignoreMouseLeave = true;
			
			setTimeout(function() {
				ignoreMouseLeave = false;
			}, 0);
		}
		
		return;
	}
	
	if (mode === "ast") {
		astModeComponent.mousedown(e);
	}
	
	if (e.button === 1) {
		onmiddlepress({
			e,
			pickOptionType: astModeComponent.getSelectedPickOption()?.type,
		});
		
		return;
	}
	
	on(window, "mouseup", mouseup);
	
	lastMousedownEvent = e;
	
	let time = Date.now();
	
	/*
	double click speed doesn't necessarily mean a double click, but it
	is important on its own as the browser won't let us do a native drag
	and drop if we're clicking quickly, even if the mousedown that starts
	the drag isn't part of a double click - ie. if it's the third click in
	a fast succession (in which case the first two are a double click and
	the third is a normal mousedown).
	
	for actual double clicks we're interested in the speed, the pairing
	of clicks, and whether the mouse moved significantly between clicks.
	*/
	
	let isDoubleClickSpeed = (
		lastClickMousedownTime
		&& time - lastClickMousedownTime <= base.getPref("doubleClickSpeed")
	);
	
	if (
		!lastMousedownWasDoubleClick
		&& lastClickMousedownEvent
		&& getDistanceBetweenMouseEvents(e, lastClickMousedownEvent) <= clickDistanceThreshold
		&& isDoubleClickSpeed
	) {
		ondblclick(e);
		
		lastMousedownWasDoubleClick = true;
	} else {
		lastMousedownWasDoubleClick = false;
	}
	
	onmousedown({
		e,
		isDoubleClick: lastMousedownWasDoubleClick,
		pickOptionType: astModeComponent.getSelectedPickOption()?.type,
		
		enableDrag(forceSynthetic=false) {
			draggable = true;
			useSyntheticDrag = forceSynthetic || isDoubleClickSpeed;
		},
	});
	
	if (useSyntheticDrag) {
		syntheticDragHandler.mousedown(e);
	}
	
	lastMousedownTime = time;
}

function mousemove(e) {
	if (useSyntheticDrag) {
		syntheticDragHandler.mousemove(e);
	}
	
	if (mode === "ast") {
		astModeComponent.mousemove(e);
	}
	
	onmousemove({
		e,
		pickOptionType: astModeComponent.getHoveredPickOption()?.type,
	});
}

function mouseup(e) {
	let mouseMoved = getDistanceBetweenMouseEvents(e, lastMousedownEvent) > clickDistanceThreshold;
	
	if (useSyntheticDrag) {
		syntheticDragHandler.mouseup(e);
	} else {
		if (!mouseMoved) {
			click(e);
		}
	}
	
	astModeComponent.mouseup();
	
	draggable = false;
	useSyntheticDrag = false;
	
	onmouseup(e);
	
	off(window, "mouseup", mouseup);
}

function click(e) {
	if (!lastMousedownWasDoubleClick) {
		onclick({
			e,
			pickOptionType: astModeComponent.getHoveredPickOption()?.type,
		});
	}
	
	lastClickMousedownEvent = lastMousedownEvent;
	lastClickMousedownTime = lastMousedownTime;
}

function marginMousedown(e) {
	onmarginMousedown(e);
}

function mouseenter(e) {
	onmouseenter(e);
}

function mouseleave(e) {
	if (ignoreMouseLeave) {
		return;
	}
	
	onmouseleave(e);
}

function contextmenu(e) {
	e.preventDefault();
	
	if (mode === "ast") {
		astModeComponent.mousedown(e);
	}
	
	oncontextmenu({
		e,
		pickOptionType: astModeComponent.getSelectedPickOption()?.type,
	});
	
	return false;
}

function dragstart(e) {
	dragStartedHere = true;
	
	//if (selectedPickOption) {
	//	let {node, x, y} = selectedPickOption;
	//	
	//	//e.dataTransfer.setDragImage(node, x, y);
	//	e.dataTransfer.setDragImage(new Image(), 0, 0);
	//} else {
	//	e.dataTransfer.setDragImage(new Image(), 0, 0);
	//}
	
	e.dataTransfer.setDragImage(new Image(), 0, 0);
	
	e.dataTransfer.effectAllowed = "all";
	
	ondragstart({
		e,
		pickOptionType: mode === "ast" ? astModeComponent.getSelectedPickOption()?.type : null,
	});
}

function dragover(e) {
	e.preventDefault();
	
	if (mode === "ast") {
		if (astModeComponent.pickOptionFromMouseEvent(e)) {
			return;
		}
		
		astModeComponent.dragover(e);
	}
	
	ondragover({
		e,
		dropTargetType: mode === "ast" ? astModeComponent.getCurrentDropTarget()?.type : null,
	});
}

let justDropped = false;

function drop(e) {
	e.preventDefault();
	
	let extra = {};
	
	if (mode === "ast") {
		extra.dropTargetType = astModeComponent.dropTargetFromMouseEvent(e)?.type;
	}
	
	if (dragStartedHere) {
		justDropped = true;
		
		if (astModeComponent.pickOptionFromMouseEvent(e)) {
			return;
		}
		
		ondrop({
			e,
			fromUs: true,
			toUs: true,
			extra,
		});
	} else {
		ondrop({
			e,
			fromUs: false,
			toUs: true,
			extra,
		});
	}
}

function dragend(e) {
	if (!justDropped) {
		ondrop({
			e,
			fromUs: true,
			toUs: false,
			extra: {},
		});
	}
	
	ondragend(e);
	
	justDropped = false;
	draggable = false;
	useSyntheticDrag = false;
	dragStartedHere = false;
	isDragging = false;
	
	astModeComponent.dragend();
}

function dragenter(e) {
	e.preventDefault();
	
	isDragging = true;
	
	ondragenter(e);
}

function dragleave(e) {
	e.preventDefault();
	
	isDragging = false;
	
	ondragleave(e);
}

function onUpdateSizes() {
	({sizes} = view);
}

function onUpdateMeasurements() {
	({rowHeight, colWidth} = view.measurements);
}

function onModeSwitch() {
	({mode} = view);
}

function onEdit() {
	({lines} = view);
}

function calculateMarginStyle(sizes) {
	return {
		width: sizes.marginWidth,
	};
}

function calculateCodeStyle(sizes, mode, dragStartedHere) {
	let cursor = mode === "ast" ? "default" : "text";
	
	if (dragStartedHere) {
		cursor = "grabbing";
	}
	
	let {width, marginWidth, marginOffset, marginStyle, codeWidth} = sizes;
	let marginWidthMinusPadding = marginWidth - marginStyle.paddingRight;
	
	return {
		left: mode === "ast" ? marginOffset : marginWidthMinusPadding,
		width: mode === "ast" ? codeWidth : width - marginWidthMinusPadding,
		cursor,
	};
}

let marginStyle = $derived(calculateMarginStyle(sizes));

let codeStyle = $derived(calculateCodeStyle(sizes, mode, dragStartedHere));

onMount(function() {
	let teardown = [
		view.on("updateSizes", onUpdateSizes),
		view.on("updateMeasurements", onUpdateMeasurements),
		view.on("scroll", onScroll),
		view.on("modeSwitch", onModeSwitch),
		view.on("updateCompletions", onUpdateCompletions),
		
		editor.on("edit", onEdit),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
@use "utils";

#main {
	@include utils.abs-sticky;
}

#margin {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
}

#code {
	position: absolute;
	top: 0;
	height: 100%;
}

#interactionLayer {
	@include utils.abs-sticky;
}
</style>

<div id="main">
	<div
		id="margin"
		style={inlineStyle(marginStyle)}
		onmousedown={marginMousedown}
	></div>
	<div
		id="code"
		style={inlineStyle(codeStyle)}
	>
		{#if mode === "ast"}
			<AstMode
				bind:this={astModeComponent}
				{editor}
			/>
		{/if}
		<div
			bind:this={interactionDiv}
			id="interactionLayer"
			draggable={draggable && !useSyntheticDrag}
			onmousedown={mousedown}
			onmousemove={mousemove}
			onmouseenter={mouseenter}
			onmouseleave={mouseleave}
			ondragstart={dragstart}
			ondragover={dragover}
			ondrop={drop}
			ondragend={dragend}
			ondragenter={dragenter}
			ondragleave={dragleave}
			oncontextmenu={contextmenu}
		>
			{#if mode === "normal"}
				<Completions {editor}/>
			{/if}
		</div>
	</div>
</div>
