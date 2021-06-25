<script>
import {createEventDispatcher} from "svelte";
import {fade} from "svelte/transition";
import unique from "../../utils/array/unique";
import {on, off} from "../../utils/dom/domEvents";
import inlineStyle from "../../utils/dom/inlineStyle";
import screenRowFromLineIndex from "../../modules/utils/screenRowFromLineIndex";
import topMargin from "../../modules/render/topMargin";
import drag from "./utils/drag";
import createDragEvent from "./utils/createDragEvent";

export let document;
export let revisionCounter;
export let overallWidth;
export let marginWidth;
export let marginOffset;
export let rowHeight;
export let colWidth;
export let scrollPosition;
export let mode;
export let pickOptions;
export let dropTargets;

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
let rowYHint = 1;

let fire = createEventDispatcher();

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
	currentDropTarget = dropTargetFromMouseEvent(e);
	
	fire("dragover", {
		e,
		target: currentDropTarget?.target?.type,
	});
}

let justDropped = false;

function drop(e) {
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
	
	fire("dragend");
	
	justDropped = false;
	draggable = false;
	useSyntheticDrag = false;
	selectedOption = null;
	dragStartedHere = false;
	isDragging = false;
}

function dragenter() {
	isDragging = true;
}

function dragleave() {
	isDragging = false;
}

function calculateMarginStyle(marginWidth) {
	return {
		width: marginWidth,
	};
}

function calculateCodeStyle(
	overallWidth,
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
		width: overallWidth - marginWidth,
		cursor,
	};
}

function rowStyle(lineIndex, rowHeight, colWidth, scrollPosition, revisionCounter) {
	let {lines} = document;
	let screenRow = screenRowFromLineIndex(lines, lineIndex, scrollPosition);
	let screenCol = lines[lineIndex].width + 1;
	
	return {
		top: topMargin + rowYHint + screenRow * rowHeight,
		left: screenCol * colWidth,
		height: rowHeight,
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
	overallWidth,
	marginOffset,
	mode,
	dragStartedHere,
);
</script>

<style type="text/scss">
@import "../../css/mixins/abs-sticky";

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
	font-size: 12px;
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
</style>

<div
	id="main"
>
	<div
		id="margin"
		style={inlineStyle(marginStyle)}
	>
		
	</div>
	<div
		id="code"
		style={inlineStyle(codeStyle)}
	>
		{#if mode === "ast"}
			{#each dropTargets as {lineIndex, targets} (lineIndex)}
				<div
					class="row"
					style={inlineStyle(rowStyle(lineIndex, rowHeight, colWidth, scrollPosition, revisionCounter))}
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
					style={inlineStyle(rowStyle(lineIndex, rowHeight, colWidth, scrollPosition, revisionCounter))}
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
			draggable={draggable && !useSyntheticDrag}
			on:dragstart={dragstart}
			on:dragover={dragover}
			on:drop={drop}
			on:dragend={dragend}
			on:dragenter={dragenter}
			on:dragleave={dragleave}
		>
			
		</div>
	</div>
</div>
