<script>
import {onMount, createEventDispatcher} from "svelte";
import unique from "utils/array/unique";
import {on, off} from "utils/dom/domEvents";
import inlineStyle from "utils/dom/inlineStyle";
import getDistanceBetweenMouseEvents from "utils/dom/getDistanceBetweenMouseEvents";
import drag from "./utils/drag";
import createDragEvent from "./utils/createDragEvent";

export let document;
export let editor;
export let view;

let fire = createEventDispatcher();

let interactionDiv;
let hoveredPickOption;
let selectedPickOption;
let draggable = false;
let useSyntheticDrag;
let currentDropTarget;
let syntheticDrag = null;
let dragStartedHere = false;
let isDragging = false;
let lastMousedownWasDoubleClick = false;
let lastMousedownEvent;
let lastMousedownTime;
let lastClickMousedownEvent;
let lastClickMousedownTime;
let clickDistanceThreshold = 2;
let ignoreMouseLeave = false;
let rowYHint = 0;

let {
	lines,
	mode,
	dropTargets,
	pickOptions,
	completions,
	scrollPosition,
	measurements: {rowHeight, colWidth},
	sizes,
} = view;

let divToPickOption = new Map();
let divToDropTarget = new Map();

function registerItem(el, map, item) {
	map.set(el, item);
	
	return {
		destroy() {
			map.delete(el);
		},
	};
}

function registerPickOption(el, option) {
	return registerItem(el, divToPickOption, option);
}

function registerDropTarget(el, option) {
	return registerItem(el, divToDropTarget, option);
}

function itemFromMouseEvent(e, map) {
	for (let el of window.document.elementsFromPoint(e.pageX, e.pageY)) {
		if (map.has(el)) {
			return map.get(el);
		}
	}
	
	return null;
}

function pickOptionFromMouseEvent(e) {
	return itemFromMouseEvent(e, divToPickOption);
}

function dropTargetFromMouseEvent(e) {
	return itemFromMouseEvent(e, divToDropTarget);
}

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
	
	selectedPickOption = pickOptionFromMouseEvent(e);
	
	if (e.button === 1) {
		fire("middlepress", {
			e,
			pickOptionType: selectedPickOption?.type,
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
		fire("dblclick", e);
		
		lastMousedownWasDoubleClick = true;
	} else {
		lastMousedownWasDoubleClick = false;
	}
	
	fire("mousedown", {
		e,
		isDoubleClick: lastMousedownWasDoubleClick,
		pickOptionType: selectedPickOption?.type,
		
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
		hoveredPickOption = pickOptionFromMouseEvent(e);
	}
	
	fire("mousemove", {
		e,
		pickOptionType: hoveredPickOption?.type,
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
	
	selectedPickOption = null;
	draggable = false;
	useSyntheticDrag = false;
	
	fire("mouseup", e);
	
	off(window, "mouseup", mouseup);
}

function click(e) {
	if (!lastMousedownWasDoubleClick) {
		fire("click", {
			e,
			pickOptionType: hoveredPickOption?.type,
		});
	}
	
	lastClickMousedownEvent = lastMousedownEvent;
	lastClickMousedownTime = lastMousedownTime;
}

function marginMousedown(e) {
	fire("marginMousedown", e);
}

function mouseenter(e) {
	fire("mouseenter", e);
}

function mouseleave(e) {
	if (ignoreMouseLeave) {
		return;
	}
	
	fire("mouseleave", e);
}

function contextmenu(e) {
	e.preventDefault();
	
	selectedPickOption = pickOptionFromMouseEvent(e);
	
	fire("contextmenu", {
		e,
		pickOptionType: selectedPickOption?.type,
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
	
	fire("dragstart", {
		e,
		pickOptionType: mode === "ast" ? selectedPickOption?.type : null,
	});
}

function dragover(e) {
	e.preventDefault();
	
	if (pickOptionFromMouseEvent(e)) {
		return;
	}
	
	if (mode === "ast") {
		currentDropTarget = dropTargetFromMouseEvent(e);
	}
	
	fire("dragover", {
		e,
		dropTargetType: mode === "ast" ? currentDropTarget?.target?.type : null,
	});
}

let justDropped = false;

function drop(e) {
	e.preventDefault();
	
	let extra = {};
	
	if (mode === "ast") {
		extra.dropTargetType = dropTargetFromMouseEvent(e)?.target?.type;
	}
	
	if (dragStartedHere) {
		justDropped = true;
		
		if (pickOptionFromMouseEvent(e)) {
			return;
		}
		
		fire("drop", {
			e,
			fromUs: true,
			toUs: true,
			extra,
		});
	} else {
		fire("drop", {
			e,
			fromUs: false,
			toUs: true,
			extra,
		});
	}
}

function dragend(e) {
	if (!justDropped) {
		fire("drop", {
			e,
			fromUs: true,
			toUs: false,
			extra: {},
		});
	}
	
	fire("dragend", e);
	
	justDropped = false;
	draggable = false;
	useSyntheticDrag = false;
	selectedPickOption = null;
	dragStartedHere = false;
	isDragging = false;
}

function dragenter(e) {
	e.preventDefault();
	
	isDragging = true;
	
	fire("dragenter", e);
}

function dragleave(e) {
	e.preventDefault();
	
	isDragging = false;
	
	fire("dragleave", e);
}

function onUpdateSizes() {
	({sizes} = view);
}

function onScroll() {
	({scrollPosition} = view);
}

function onUpdateMeasurements() {
	({rowHeight, colWidth} = view.measurements);
}

function onModeSwitch() {
	({mode} = view);
}

function onUpdatePickOptions() {
	({pickOptions} = view);
}

function onUpdateDropTargets() {
	({dropTargets} = view);
}

function onUpdateCompletions() {
	({completions} = view);
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

function rowStyle(lines, lineIndex, rowHeight, colWidth, scrollPosition) {
	let screenY = view.screenYFromLineIndex(lineIndex);
	let line = lines[lineIndex];
	let screenCol = line.trimmed ? line.width + 1 : line.width;
	
	return {
		top: sizes.topMargin + rowYHint + screenY,
		left: screenCol * colWidth - scrollPosition.x,
		height: rowHeight,
	};
}

function completionsStyle(completions, rowHeight, colWidth, scrollPosition) {
	let {cursor} = completions;
	let [row, col] = view.rowColFromCursor(cursor);
	let screenY = view.screenYFromLineIndex(cursor.lineIndex + 1);
	let screenCol = col;
	
	return {
		top: sizes.topMargin + rowYHint + screenY,
		left: screenCol * colWidth - scrollPosition.x,
	};
}

function targetIsActive(target, currentDropTarget) {
	if (!currentDropTarget) {
		return false;
	}
	
	return (
		target.lineIndex === currentDropTarget.lineIndex
		&& target.target.type === currentDropTarget.target.type
	);
}

$: marginStyle = calculateMarginStyle(sizes, mode);

$: codeStyle = calculateCodeStyle(sizes, mode, dragStartedHere);

onMount(function() {
	let teardown = [
		view.on("updateSizes", onUpdateSizes),
		view.on("updateMeasurements", onUpdateMeasurements),
		view.on("scroll", onScroll),
		view.on("modeSwitch", onModeSwitch),
		view.on("updatePickOptions", onUpdatePickOptions),
		view.on("updateDropTargets", onUpdateDropTargets),
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
@import "mixins/abs-sticky";

#main {
	@include abs-sticky;
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
	@include abs-sticky;
}

.row {
	position: absolute;
	display: flex;
	align-items: center;
	gap: 5px;
}

.item {
	/*font-weight: bold;*/
	font-size: 11px;
	border: 1px solid #544200;
	border-radius: 100px;
	padding: 0 5px;
}

.pickOption {
	color: #3D2F00;
	background: #D6AD0C;
	
	&.active {
		color: #FCEEC2;
		background: #A88712;
	}
	
	&:not(.hover):not(.active) {
		opacity: .5;
	}
}

.dropTarget {
	color: #EFD2C4;
	background: #A0451E;
	background: #D34F0C;
	
	&.active {
		color: #FCDFD1;
		background: #B24711;
	}
	
	&.fade {
		opacity: .35;
	}
}

#completions {
	position: absolute;
	max-height: 150px;
	overflow-y: auto;
	cursor: default;
	background: white;
}
</style>

<div
	id="main"
>
	<div
		id="margin"
		style={inlineStyle(marginStyle)}
		on:mousedown={marginMousedown}
	></div>
	<div
		id="code"
		style={inlineStyle(codeStyle)}
	>
		{#if mode === "ast"}
			{#each dropTargets as {lineIndex, targets} (lineIndex)}
				<div
					class="row"
					style={inlineStyle(rowStyle(lines, lineIndex, rowHeight, colWidth, scrollPosition))}
				>
					{#each targets as target (target)}
						<div
							use:registerDropTarget={target}
							class="item dropTarget"
							class:active={targetIsActive(target, currentDropTarget)}
							class:fade={!isDragging}
						>
							{target.target.label}
						</div>
					{/each}
				</div>
			{/each}
			{#each pickOptions as {lineIndex, options} (lineIndex)}
				<div
					class="row"
					style={inlineStyle(rowStyle(lines, lineIndex, rowHeight, colWidth, scrollPosition))}
				>
					{#each options as {option}}
						<div
							use:registerPickOption={option}
							class="item pickOption"
							class:hover={option.type === hoveredPickOption?.type}
							class:active={option.type === selectedPickOption?.type}
						>
							{option.label}
						</div>
					{/each}
				</div>
			{/each}
		{/if}
		<div
			bind:this={interactionDiv}
			id="interactionLayer"
			draggable={draggable && !useSyntheticDrag}
			on:mousedown={mousedown}
			on:mousemove={mousemove}
			on:mouseenter={mouseenter}
			on:mouseleave={mouseleave}
			on:dragstart={dragstart}
			on:dragover={dragover}
			on:drop={drop}
			on:dragend={dragend}
			on:dragenter={dragenter}
			on:dragleave={dragleave}
			on:contextmenu={contextmenu}
		>
			{#if completions}
				<div
					id="completions"
					style={inlineStyle(completionsStyle(completions, rowHeight, colWidth, scrollPosition))}
					on:wheel={e => e.stopPropagation()}
					on:mousedown={e => e.stopPropagation()}
					on:click={e => e.stopPropagation()}
					on:dblclick={e => e.stopPropagation()}
				>
					{#each completions.completions as completion}
						<div
							class="completion"
							class:selected={completion === completions.selectedCompletion}
						>
							{completion.label}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
