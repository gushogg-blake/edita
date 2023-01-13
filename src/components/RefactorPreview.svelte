<script>
import {onMount, getContext, createEventDispatcher} from "svelte";
import Editor from "components/Editor/Editor.svelte";

export let refactorPreview;

let {
	paths,
	selectedFile,
} = refactorPreview;

function onSelectPath(e) {
	refactorPreview.selectPath(e.target.value);
}

function onUpdatePaths() {
	({paths} = refactorPreview);
}

onMount(function() {
	let teardown = [
		refactorPreview.on("updatePaths", onUpdatePaths),
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
	display: grid;
	grid-template-rows: auto 1fr;
	width: 100%;
	height: 100%;
	background: var(--tabSelectedBackground);
}

#controls {
	border-bottom: var(--appBorderMedium);
	padding: 5px;
}

#editors {
	display: grid;
	grid-template-columns: 1fr 1fr;
	
	> div:first-child {
		border-right: var(--appBorderMedium);
	}
}
</style>

<div id="main">
	<div id="controls">
		{#if paths.length > 0}
			<div>
				<select class="compact" on:change={onSelectPath}>
					{#each paths as path}
						<option value={path}>{path}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>
	<div id="editors">
		<div>
			<Editor editor={refactorPreview.editors.results}/>
		</div>
		<div>
			<Editor editor={refactorPreview.editors.preview}/>
		</div>
	</div>
</div>
