<script lang="ts">
import {onMount} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import type {PickOption, DropTarget} from "ui/editor";
//import type {PickOptionType, DropTargetType} from "core/astMode";

let {
	editor,
} = $props();

export function mousedown(e) {
	selectedPickOption = pickOptionFromMouseEvent(e);
}

export function mousemove(e) {
	hoveredPickOption = pickOptionFromMouseEvent(e);
}

export function mouseup() {
	selectedPickOption = null;
}

export function dragenter() {
	isDragging = true;
}

export function dragleave() {
	isDragging = false;
}

export function dragover(e) {
	currentDropTarget = dropTargetFromMouseEvent(e);
	isDragging = true;
}

export function dragend() {
	selectedPickOption = null;
	isDragging = false;
}

export function getSelectedPickOption() {
	return selectedPickOption;
}

export function getHoveredPickOption() {
	return hoveredPickOption;
}

export function getCurrentDropTarget() {
	return currentDropTarget;
}

let {document, view} = editor;
let {measurements, astMode} = view;

let rowYHint = 0;

let scrollPosition = $state(view.scrollPosition);
let sizes = $state(view.sizes);
let rowHeight = $state(measurements.rowHeight);
let colWidth = $state(measurements.colWidth);

let lines = $state(view.lines);
let dropTargetsByLine = $state(astMode.dropTargetsByLine);
let pickOptionsByLine = $state(astMode.pickOptionsByLine);

let hoveredPickOption: PickOption | null = $state();
let selectedPickOption: PickOption | null = $state();
let currentDropTarget: DropTarget | null = $state();

let divToPickOption = new Map<HTMLDivElement, PickOption>();
let divToDropTarget = new Map<HTMLDivElement, DropTarget>();

let isDragging = $state(false);

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

export function pickOptionFromMouseEvent(e) {
	return itemFromMouseEvent(e, divToPickOption);
}

export function dropTargetFromMouseEvent(e) {
	return itemFromMouseEvent(e, divToDropTarget);
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

function onUpdatePickOptions() {
	({pickOptionsByLine} = view);
}

function onUpdateDropTargets() {
	({dropTargetsByLine} = view);
}

function onEdit() {
	({lines} = view);
}

function rowStyle(lines, lineIndex, rowHeight, colWidth, scrollPosition) {
	let screenY = view.canvasUtils.screenYFromLineIndex(lineIndex);
	let line = lines[lineIndex];
	let screenCol = line.trimmed ? line.width + 1 : line.width;
	
	return {
		top: sizes.topMargin + rowYHint + screenY,
		left: screenCol * colWidth - scrollPosition.x,
		height: rowHeight,
	};
}

function targetIsActive(dropTarget, currentDropTarget) {
	if (!currentDropTarget) {
		return false;
	}
	
	return (
		dropTarget.lineIndex === currentDropTarget.lineIndex
		&& dropTarget.type === currentDropTarget.type
	);
}

onMount(function() {
	let teardown = [
		view.on("updateSizes", onUpdateSizes),
		view.on("updateMeasurements", onUpdateMeasurements),
		view.on("scroll", onScroll),
		
		astMode.on("updatePickOptions", onUpdatePickOptions),
		astMode.on("updateDropTargets", onUpdateDropTargets),
		
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
</style>

<div id="main">
	{#each dropTargetsByLine as {lineIndex, dropTargets} (lineIndex)}
		<div
			class="row"
			style={inlineStyle(rowStyle(lines, lineIndex, rowHeight, colWidth, scrollPosition))}
		>
			{#each dropTargets as dropTarget (dropTarget)}
				<div
					use:registerDropTarget={dropTarget}
					class="item dropTarget"
					class:active={targetIsActive(dropTarget, currentDropTarget)}
					class:fade={!isDragging}
				>
					{dropTarget.type.label}
				</div>
			{/each}
		</div>
	{/each}
	{#each pickOptionsByLine as {lineIndex, pickOptions} (lineIndex)}
		<div
			class="row"
			style={inlineStyle(rowStyle(lines, lineIndex, rowHeight, colWidth, scrollPosition))}
		>
			{#each pickOptions as pickOption}}
				<div
					use:registerPickOption={registerPickOption}
					class="item pickOption"
					class:hover={pickOption === hoveredPickOption}
					class:active={pickOption === selectedPickOption}
				>
					{pickOption.type.label}
				</div>
			{/each}
		</div>
	{/each}
</div>
