<script>
import {onMount, createEventDispatcher} from "svelte";
import {fade} from "svelte/transition";
import unique from "utils/array/unique";
import {on, off} from "utils/dom/domEvents";
import inlineStyle from "utils/dom/inlineStyle";
import drag from "./utils/drag";
import createDragEvent from "./utils/createDragEvent";

export let document;
export let editor;
export let view;

let fire = createEventDispatcher();

let interactionDiv;
let hoveredOption;
let selectedOption;
let draggable = false;
let useSyntheticDrag;
let currentDropTarget;
let clickDistanceThreshold = 2;
let mouseMovedDistance;
let syntheticDrag = null;
let dragStartedHere = false;
let isDragging = false;
let rowYHint = 0;

let {
	wrappedLines,
	mode,
	dropTargets,
	pickOptions,
	completions,
	scrollPosition,
	
	measurements: {
		rowHeight,
		colWidth,
	},
	
	sizes: {
		width,
		marginWidth,
		marginOffset,
	},
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
	
	click(e) {
		fire("click", e);
	},
});

function mousedown(e) {
	mouseMovedDistance = 0;
	
	on(window, "mouseup", mouseup);
	
	selectedOption = pickOptionFromMouseEvent(e);
	
	fire("mousedown", {
		e,
		option: selectedOption?.type,
		
		enableDrag(useSynthetic) {
			draggable = true;
			useSyntheticDrag = useSynthetic;
		},
	});
	
	if (useSyntheticDrag) {
		syntheticDragHandler.mousedown(e);
	}
}

function mousemove(e) {
	mouseMovedDistance++;
	
	if (useSyntheticDrag) {
		syntheticDragHandler.mousemove(e);
	}
	
	if (mode === "ast") {
		hoveredOption = pickOptionFromMouseEvent(e);
		
		fire("optionhover", {
			e,
			option: hoveredOption,
		});
	}
	
	fire("mousemove", e);
}

function mouseup(e) {
	if (useSyntheticDrag) {
		if (mode === "ast") {
			syntheticDragHandler.mouseup(e);
		}
	} else {
		if (mouseMovedDistance <= clickDistanceThreshold) {
			fire("click", e);
		}
	}
	
	selectedOption = null;
	draggable = false;
	useSyntheticDrag = false;
	
	fire("mouseup", e);
	
	off(window, "mouseup", mouseup);
}

function mouseenter(e) {
	fire("mouseenter", e);
}

function mouseleave(e) {
	fire("mouseleave", e);
}

function contextmenu(e) {
	e.preventDefault();
	
	return false;
}

function dragstart(e) {
	dragStartedHere = true;
	
	//if (selectedOption) {
	//	let {node, x, y} = selectedOption;
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
		option: selectedOption?.type,
	});
}

function dragover(e) {
	e.preventDefault();
	
	currentDropTarget = dropTargetFromMouseEvent(e);
	
	fire("dragover", {
		e,
		target: currentDropTarget?.target?.type,
	});
}

let justDropped = false;

function drop(e) {
	e.preventDefault();
	
	let extra = {};
	
	if (mode === "ast") {
		extra.target = dropTargetFromMouseEvent(e)?.target?.type;
	}
	
	if (dragStartedHere) {
		justDropped = true;
		
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
	selectedOption = null;
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
	({
		sizes: {
			width,
			marginWidth,
			marginOffset,
		},
	} = view);
}

function onScroll() {
	({
		scrollPosition,
	} = view);
}

function onUpdateMeasurements() {
	({
		rowHeight,
		colWidth,
	} = view.measurements);
}

function onModeSwitch() {
	({
		mode,
	} = view);
}

function onUpdatePickOptions() {
	({
		pickOptions,
	} = view);
}

function onUpdateDropTargets() {
	({
		dropTargets,
	} = view);
}

function onUpdateCompletions() {
	({
		completions,
	} = view);
}

function onEdit() {
	({
		wrappedLines,
	} = view);
}

function calculateMarginStyle(marginWidth) {
	return {
		width: marginWidth,
	};
}

function calculateCodeStyle(
	width,
	marginWidth,
	mode,
	dragStartedHere,
) {
	let cursor = mode === "ast" ? "default" : "text";
	
	if (dragStartedHere) {
		cursor = "grabbing";
	}
	
	return {
		left: marginWidth,
		width: width - marginWidth,
		cursor,
	};
}

function rowStyle(wrappedLines, lineIndex, rowHeight, colWidth, scrollPosition) {
	let screenY = view.screenYFromLineIndex(lineIndex);
	let screenCol = wrappedLines[lineIndex].line.width + 1;
	
	return {
		top: view.sizes.topMargin + rowYHint + screenY,
		left: screenCol * colWidth - scrollPosition.x,
		height: rowHeight,
	};
}

function completionsStyle(wrappedLines, completions, rowHeight, colWidth, scrollPosition) {
	let {cursor} = completions;
	let [row, col] = view.rowColFromCursor(cursor);
	let screenY = view.screenYFromLineIndex(cursor.lineIndex + 1);
	let screenCol = col;
	
	return {
		top: view.sizes.topMargin + rowYHint + screenY,
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

$: marginStyle = calculateMarginStyle(marginWidth);

$: codeStyle = calculateCodeStyle(
	width,
	marginOffset,
	mode,
	dragStartedHere,
);

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

<style type="text/scss">
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
	
	&:not(.hover) {
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
}
</style>

<div id="main">
	<div
		id="margin"
		style={inlineStyle(marginStyle)}
	></div>
	<div
		id="code"
		style={inlineStyle(codeStyle)}
	>
		{#if mode === "ast"}
			{#each dropTargets as {lineIndex, targets} (lineIndex)}
				<div
					class="row"
					style={inlineStyle(rowStyle(wrappedLines, lineIndex, rowHeight, colWidth, scrollPosition))}
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
					style={inlineStyle(rowStyle(wrappedLines, lineIndex, rowHeight, colWidth, scrollPosition))}
				>
					{#each options as {option}}
						<div
							use:registerPickOption={option}
							class="item pickOption"
							class:hover={option.type === hoveredOption?.type}
							class:active={option.type === selectedOption?.type}
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
			on:mousedown={mousedown}
			on:mouseenter={mouseenter}
			on:mouseleave={mouseleave}
			on:mousemove={mousemove}
			on:dblclick
			on:contextmenu={contextmenu}
			draggable={draggable && !useSyntheticDrag}
			on:dragstart={dragstart}
			on:dragover={dragover}
			on:drop={drop}
			on:dragend={dragend}
			on:dragenter={dragenter}
			on:dragleave={dragleave}
		>
			{#if completions}
				<div
					id="completions"
					style={inlineStyle(completionsStyle(wrappedLines, completions, rowHeight, colWidth, scrollPosition))}
					on:wheel={e => e.stopPropagation()}
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
