<script>
import {createEventDispatcher} from "svelte";
import unique from "../../utils/array/unique";
import {on, off} from "../../utils/dom/domEvents";
import inlineStyle from "../../utils/dom/inlineStyle";
import topMargin from "../../modules/render/topMargin";

export let overallWidth;
export let marginWidth;
export let marginOffset;
export let rowHeight;
export let mode;
export let pickOptions;
export let dropTargets;

let codeDiv;
let selectedOption;
let draggable = false;
let currentDropTarget;

let fire = createEventDispatcher();

$: pickOptionRows = unique(pickOptions.map(option => option.screenRow));
$: dropTargetRows = unique(dropTargets.map(target => target.screenRow));

function mousedown(e) {
	on(window, "mouseup", mouseup);
	
	fire("mousedown", {
		e,
		
		enableDrag() {
			draggable = true;
		},
	});
}

function mousemove(e) {
	
	fire("mousemove", e);
}

function mouseup(e) {
	draggable = false;
	selectedOption = null;
	
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
	if (selectedOption) {
		let {node, x, y} = selectedOption;
		
		e.dataTransfer.setDragImage(node, x, y);
	} else {
		e.dataTransfer.setDragImage(new Image(), 0, 0);
	}
}

function dragover(e) {
	fire("dragover", e);
}

function drop(e) {
	fire("drop", e);
}

function dragend(e) {
	draggable = false;
	selectedOption = null;
	
}

function pickOptionMousedown(option, e) {
	e.stopPropagation();
	
	draggable = true;
	
	selectedOption = {
		option,
		node: e.target,
		x: e.offsetX,
		y: e.offsetY,
	};
	
	fire("optionmousedown", {
		option,
		e,
	});
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

function dropTargetDragover(target) {
	//console.log("dragover", target);
}

function dropTargetDragenter(target) {
	currentDropTarget = target;
}

function dropTargetDragleave(target) {
	if (currentDropTarget === target) {
		currentDropTarget = null;
	}
}

function dropTargetDrop(target) {
	console.log("drop", target);
}

function calculateMarginStyle(marginWidth) {
	return {
		width: marginWidth,
	};
}

function calculateCodeStyle(overallWidth, marginWidth, mode) {
	return {
		left: marginWidth,
		width: overallWidth - marginWidth,
		cursor: mode === "ast" ? "default" : "text",
	};
}

//function pickOptionRowStyle(screenRow, rowHeight) {
//	return {
//		top: screenRow * rowHeight,
//	};
//}
//
//function dropTargetRowStyle(screenRow, rowHeight) {
//	return {
//		top: screenRow * rowHeight,
//		height: rowHeight,
//	};
//}

function rowStyle(screenRow, rowHeight) {
	return {
		top: topMargin + screenRow * rowHeight,
		height: rowHeight,
	};
}

$: marginStyle = calculateMarginStyle(marginWidth);
$: codeStyle = calculateCodeStyle(overallWidth, marginOffset, mode);
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
	left: 200px;
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
}

.dropTarget {
	color: #EFD2C4;
	background: #A0451E;
	background: #D34F0C;
	
	&.active {
		color: #FCDFD1;
		background: #B24711;
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
		{draggable}
		on:dragstart={dragstart}
		on:dragover={dragover}
		on:drop={drop}
		on:dragend={dragend}
	>
		{#if mode === "ast"}
			{#each pickOptionRows as screenRow}
				<div
					class="row"
					style={inlineStyle(rowStyle(screenRow, rowHeight))}
				>
					{#each pickOptions.filter(o => o.screenRow === screenRow) as option}
						<div
							class="option pickOption"
							on:mousedown={(e) => pickOptionMousedown(option, e)}
							on:mouseenter={(e) => pickOptionMouseenter(option, e)}
							on:mouseleave={(e) => pickOptionMouseleave(option, e)}
						>
							{option.label}
						</div>
					{/each}
				</div>
			{/each}
			{#each dropTargetRows as screenRow}
				<div
					class="row"
					style={inlineStyle(rowStyle(screenRow, rowHeight))}
				>
					{#each dropTargets.filter(o => o.screenRow === screenRow) as target}
						<div
							class="option dropTarget"
							class:active={target === currentDropTarget}
							on:dragover={(e) => dropTargetDragover(target, e)}
							on:dragenter={(e) => dropTargetDragenter(target, e)}
							on:dragleave={(e) => dropTargetDragleave(target, e)}
							on:drop={(e) => dropTargetDrop(target, e)}
						>
							{target.label}
						</div>
					{/each}
				</div>
			{/each}
		{/if}
	</div>
</div>
