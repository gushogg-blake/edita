<script>
import {createEventDispatcher} from "svelte";
import unique from "../../utils/array/unique";
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
let lastMouseDownElement;
let draggable = false;

let fire = createEventDispatcher();

$: pickOptionRows = unique(pickOptions.map(option => option.screenRow));
$: dropTargetRows = unique(dropTargets.map(target => target.screenRow));

function mousedown(e) {
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
	
	fire("mousedown", e);
}

function mouseenter(e) {
	fire("mouseenter", e);
}

function mouseleave(e) {
	fire("mouseleave", e);
}

function dragover(e) {
	window.dispatchEvent(new Event("dragover"));
	
	fire("dragover", e);
}

function drop(e) {
	fire("drop", e);
}

function dragstart(e) {
	console.log(e);
	
	if (lastMouseDownElement) {
		let {node, x, y} = lastMouseDownElement;
		
		e.dataTransfer.setDragImage(node, x, y);
		
		lastMouseDownElement = null;
	}
}

function dragend(e) {
	draggable = false;
	
	window.dispatchEvent(new Event("dragend"));
}

function pickOptionMousedown(option, e) {
	console.log(option, e);
	
	draggable = true;
	
	lastMouseDownElement = {
		node: e.target,
		x: e.offsetX,
		y: e.offsetY,
	};
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
	color: #3D2F00;
	/*font-weight: bold;*/
	font-size: 12px;
	border: 1px solid #544200;
	border-radius: 100px;
	padding: 0 5px;
	background: #D6AD0C;
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
						>
							{option.label}
						</div>
					{/each}
				</div>
			{/each}
		{/if}
		
	</div>
	
	{#each dropTargets as target}
		
	{/each}
</div>
