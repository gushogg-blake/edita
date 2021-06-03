<script>
import {createEventDispatcher} from "svelte";
import unique from "../../utils/array/unique";
import inlineStyle from "../../utils/dom/inlineStyle";

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
}

function dragend(e) {
	draggable = false;
	
	window.dispatchEvent(new Event("dragend"));
}

function pickOptionMousedown(option, e) {
	console.log(option, e);
	draggable = true;
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
}

function rowStyle(screenRow, rowHeight) {
	return {
		top: screenRow * rowHeight,
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
	display: flex;
	align-items: center;
	gap: 5px;
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
		
	</div>
	{#each pickOptionRows as screenRow}
		<div
			class="row"
			style={inlineStyle(rowStyle(screenRow, rowHeight))}
		>
			{#each pickOptions.filter(o => o.screenRow === screenRow) as option}
				<div
					class="pickOption"
					on:mousedown={(e) => pickOptionMousedown(option, e)}
				>
					{option.label}
				</div>
			{/each}
		</div>
	{/each}
	{#each dropTargets as target}
		
	{/each}
</div>
