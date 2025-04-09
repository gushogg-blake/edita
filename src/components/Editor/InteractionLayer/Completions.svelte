<script lang="ts">
import {onMount} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";

let {
	editor,
} = $props();

let {document, view} = editor;
let {measurements} = view;

let rowYHint = 0;

let lines = $state(view.lines);
let sizes = $state(view.sizes);
let scrollPosition = $state(view.scrollPosition);
let rowHeight = $state(measurements.rowHeight);
let colWidth = $state(measurements.colWidth);

let completions = $state(view.completions);

function completionsStyle(completions, rowHeight, colWidth, scrollPosition) {
	let {cursor} = completions;
	let [row, col] = view.canvasUtils.rowColFromCursor(cursor);
	let screenY = view.canvasUtils.screenYFromLineIndex(cursor.lineIndex + 1);
	let screenCol = col;
	
	return {
		top: sizes.topMargin + rowYHint + screenY,
		left: screenCol * colWidth - scrollPosition.x,
	};
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

function onUpdateCompletions() {
	({completions} = view);
}

function onEdit() {
	({lines} = view);
}

onMount(function() {
	let teardown = [
		view.on("updateSizes", onUpdateSizes),
		view.on("updateMeasurements", onUpdateMeasurements),
		view.on("scroll", onScroll),
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
#main {
	position: absolute;
	max-height: 150px;
	overflow-y: auto;
	cursor: default;
	background: white;
}
</style>

<div
	id="main"
	style={inlineStyle(completionsStyle(completions, rowHeight, colWidth, scrollPosition))}
	onwheel={e => e.stopPropagation()}
	onmousedown={e => e.stopPropagation()}
	onclick={e => e.stopPropagation()}
	ondblclick={e => e.stopPropagation()}
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
