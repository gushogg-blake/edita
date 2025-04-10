<script lang="ts">
import {onMount} from "svelte";
import type {Editor} from "ui/editor";
import type {ActiveCompletions} from "ui/editor/view";
import inlineStyle from "utils/dom/inlineStyle";

type Props = {
	editor: Editor;
};

let {
	editor,
}: Props = $props();

let {document, view} = editor;
let {measurements} = view;

let rowYHint = 0;

let lines = $state(view.lines);
let sizes = $state(view.sizes);
let scrollPosition = $state(view.scrollPosition);
let rowHeight = $state(measurements.rowHeight);
let colWidth = $state(measurements.colWidth);

let activeCompletions = $state(view.activeCompletions);

function completionsStyle(activeCompletions, rowHeight, colWidth, scrollPosition) {
	let {cursor} = activeCompletions;
	let {row, col} = view.canvasUtils.rowColFromCursor(cursor);
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
	({activeCompletions} = view);
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

{#if activeCompletions}
	<div
		id="main"
		style={inlineStyle(completionsStyle(onUpdateCompletions, rowHeight, colWidth, scrollPosition))}
		onwheel={e => e.stopPropagation()}
		onmousedown={e => e.stopPropagation()}
		onclick={e => e.stopPropagation()}
		ondblclick={e => e.stopPropagation()}
	>
		{#each activeCompletions.completions as completion}
			<div
				class="completion"
				class:selected={completion === activeCompletions.selectedCompletion}
			>
				{completion.label}
			</div>
		{/each}
	</div>
{/if}
