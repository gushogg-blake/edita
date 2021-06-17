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

let codeDiv;
let selectedOption;
let draggable = false;
let useSyntheticDrag;
let currentDropTarget;
let clickDistanceThreshold = 2;
let mouseMovedDistance;
let syntheticDrag = null;
let isDragging = false;
let mouseIsDown = false;

let fire = createEventDispatcher();

let divToDropTarget = new Map();

function registerDropTarget(el, target) {
	divToDropTarget.set(el, target);
	
	return {
		destroy() {
			divToDropTarget.delete(el);
		},
	};
}

function dropTargetFromMouseEvent(e) {
	for (let el of window.document.elementsFromPoint(e.pageX, e.pageY)) {
		if (divToDropTarget.has(el)) {
			return divToDropTarget.get(el);
		}
	}
	
	return null;
}

let syntheticDragHandler = drag({
	start(e) {
		syntheticDrag = {
			data: null,
			
			setData(type, data) {
				this.data = {
					type,
					data,
				};
			},
			
			getData(type) {
				if (!this.data || this.data.type !== type) {
					return null;
				}
				
				return this.data.data;
			},
			
			setDragImage() {
			},
		};
		
		codeDiv.dispatchEvent(createDragEvent.dragstart(e, syntheticDrag));
	},
	
	move(e, x, y) {
		codeDiv.dispatchEvent(createDragEvent.dragover(e, syntheticDrag));
		
		// dragenter, dragleave, dragover on other els
	},
	
	end(e) {
		mouseIsDown = false;
		
		// TODO only fire drop if over drop target
		codeDiv.dispatchEvent(createDragEvent.drop(e, syntheticDrag));
		codeDiv.dispatchEvent(createDragEvent.dragend(e, syntheticDrag));
		
		syntheticDrag = null;
	},
	
	click(e) {
		mouseIsDown = false;
		
		fire("click", e);
	},
});

function mousedown(e) {
	mouseIsDown = true;
	mouseMovedDistance = 0;
	
	on(window, "mouseup", mouseup);
	
	fire("mousedown", {
		e,
		option: selectedOption?.option?.type,
		
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
	
	fire("mousemove", e);
}

function mouseup(e) {
	mouseIsDown = false;
	
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
	isDragging = true;
	
	if (selectedOption) {
		let {node, x, y} = selectedOption;
		
		//e.dataTransfer.setDragImage(node, x, y);
		e.dataTransfer.setDragImage(new Image(), 0, 0);
	} else {
		e.dataTransfer.setDragImage(new Image(), 0, 0);
	}
	
	fire("dragstart", {
		e,
		option: selectedOption?.option?.type,
	});
}

function dragover(e) {
	currentDropTarget = dropTargetFromMouseEvent(e);
	
	//console.log(currentDropTarget);
	
	fire("dragover", e);
}

function drop(e) {
	let dropTarget = dropTargetFromMouseEvent(e);
	
	fire("drop", {
		e,
		target: dropTarget?.target
	});
	
	mouseIsDown = false;
	draggable = false;
	useSyntheticDrag = false;
	selectedOption = null;
	isDragging = false;
}

function dragend(e) {
	mouseIsDown = false;
	draggable = false;
	useSyntheticDrag = false;
	selectedOption = null;
	isDragging = false;
	
	fire("dragend", e);
}

function pickOptionMousedown(option, e) {
	selectedOption = {
		option,
		node: e.target,
		x: e.offsetX,
		y: e.offsetY,
	};
}

function pickOptionMouseenter(option, e) {
	fire("optionhover", {
		option,
		e,
	});
}

function pickOptionMouseleave(option, e) {
	fire("optionhover", {
		option: null,
		e,
	});
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
	isDragging,
) {
	let cursor = mode === "ast" ? "default" : "text";
	
	if (isDragging) {
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
		top: topMargin + screenRow * rowHeight,
		left: screenCol * colWidth,
		height: rowHeight,
	};
}

$: marginStyle = calculateMarginStyle(marginWidth);

$: codeStyle = calculateCodeStyle(
	overallWidth,
	marginOffset,
	mode,
	isDragging,
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

.row {
	position: absolute;
	display: flex;
	align-items: center;
	gap: 5px;
}

.option {
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
	
	&.fadeIfNotHover:not(:hover) {
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
		bind:this={codeDiv}
		id="code"
		style={inlineStyle(codeStyle)}
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
	>
		{#if mode === "ast"}
			{#each pickOptions as {lineIndex, options} (lineIndex)}
				<div
					class="row"
					style={inlineStyle(rowStyle(lineIndex, rowHeight, colWidth, scrollPosition, revisionCounter))}
				>
					{#each options as {option}}
						<div
							class="option pickOption"
							class:active={option.type === selectedOption?.option?.type}
							class:fadeIfNotHover={!mouseIsDown}
							on:mousedown={(e) => pickOptionMousedown(option, e)}
							on:mouseenter={(e) => pickOptionMouseenter(option, e)}
							on:mouseleave={(e) => pickOptionMouseleave(option, e)}
						>
							{option.label}
						</div>
					{/each}
				</div>
			{/each}
			{#each dropTargets as {lineIndex, targets} (lineIndex)}
				<div
					class="row"
					style={inlineStyle(rowStyle(lineIndex, rowHeight, colWidth, scrollPosition, revisionCounter))}
				>
					{#each targets as target (target)}
						<div
							use:registerDropTarget={target}
							class="option dropTarget"
							class:active={target === currentDropTarget}
							class:fade={!mouseIsDown}
						>
							{target.target.label}
						</div>
					{/each}
				</div>
			{/each}
		{/if}
	</div>
</div>
