<script>
import {onMount, getContext, createEventDispatcher} from "svelte";

import Editor from "components/Editor/Editor.svelte";
import NodePathTooltip from "./NodePathTooltip.svelte";

export let refactor;

let fire = createEventDispatcher();

let app = getContext("app");

let tooltipComponents = {
	nodePath: NodePathTooltip,
};

function onOptionsChanged() {
	
}

function onUpdatePaths() {
	({paths} = refactor);
}

function onSelectPath(e) {
	refactor.selectPath(e.target.value);
}

function onRequestTooltipComponent(type, callback) {
	callback(tooltipComponents[type]);
}

onMount(function() {
	let teardown = [
		refactor.on("optionsChanged", onOptionsChanged),
		refactor.on("updatePaths", onUpdatePaths),
		refactor.on("requestTooltipComponent", onRequestTooltipComponent),
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
	--borderColor: var(--appBorderColor);
	--border: 1px solid var(--borderColor);
	
	display: grid;
	grid-template-rows: auto 1fr;
	width: 100%;
	height: 100%;
}

#controls {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	padding: 8px;
}

#actions {
	display: flex;
	flex-direction: column;
}

#editors {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
}

#editors > div {
	display: grid;
	grid-template-rows: auto 1fr;
	
	&:last-child .editor {
		border-left: var(--appBorder);
	}
}

.header {
	padding: 3px 5px;
}

.editor {
	height: 100%;
}

select {
	max-width: 100%;
}
</style>

<div id="main">
	<div id="controls">
		<div id="options">
			<AccelLabel for="searchIn" label="Search %in"/>
			<select bind:value={formOptions.searchIn} id="searchIn">
				<option value="currentDocument">Current document</option>
				<option value="selectedText">Selected text</option>
				<option value="openFiles">Open files</option>
				<option value="files">Files</option>
			</select>
			<input bind:value={formOptions.globs} id="globs" disabled={formOptions.searchIn !== "files"}>
		</div>
		<div id="actions">
			<Spacer/>
			{#if paths.length > 0}
				<div>
					<select on:change={onSelectPath}>
						{#each paths as path}
							<option value={path}>{path}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
	</div>
	<div id="editors">
		<div>
			<div class="header">
				<AccelLabel for={findEditor} label="%Find"/>
			</div>
			<div class="editor">
				<Editor
					bind:this={findEditor}
					editor={refactor.editors.find}
				/>
			</div>
		</div>
		<div>
			<div class="header">
				<AccelLabel for={replaceWithEditor} label="Rep%lace with"/>
			</div>
			<div class="editor">
				<Editor
					bind:this={replaceWithEditor}
					editor={refactor.editors.replaceWith}
				/>
			</div>
		</div>
	</div>
</div>
