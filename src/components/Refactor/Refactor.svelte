<script>
import {onMount, getContext, createEventDispatcher} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import accels from "components/actions/accels";
import Accel from "components/utils/Accel.svelte";
import AccelLabel from "components/utils/AccelLabel.svelte";
import Gap from "components/utils/Gap.svelte";
import Spacer from "components/utils/Spacer.svelte";
import Editor from "components/Editor/Editor.svelte";

export let refactor;

let fire = createEventDispatcher();

let app = getContext("app");

let matchEditor;
let matchedEditor;
let replaceWithEditor;
let refactoredEditor;

let formOptions = getFormOptions(refactor.options);

let {paths} = refactor;

$: refactor.setOptions(getOptions(formOptions));

function getFormOptions(options) {
	return options;
}

function getOptions(formOptions) {
	return formOptions;
}

let preview = {
	path: null,
	matched: "",
	refactored: "",
};

function onOptionsChanged() {
	
}

function onUpdatePaths() {
	({paths} = refactor);
}

function onSelectPath(e) {
	refactor.selectPath(e.target.value);
}

onMount(function() {
	let teardown = [
		refactor.on("optionsChanged", onOptionsChanged),
		refactor.on("updatePaths", onUpdatePaths),
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
	grid-template-rows: auto 1fr auto 1fr;
	//border-top: var(--appBorder);
}

.headers, .editors {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
}

.headers {
	//border-top: var(--border);
	
	> div {
		padding: 3px 5px;
		background: var(--appBackground);
	}
}

.editors {
	gap: 1px;
	background: var(--appBorderColor);
	
	> div {
		height: 100%;
	}
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
		<div class="headers">
			<div>
				<AccelLabel for={matchEditor} label="%Match"/>
			</div>
			<div>
				<label>Matches</label>
			</div>
		</div>
		<div class="editors">
			<div>
				<Editor
					bind:this={matchEditor}
					editor={refactor.editors.match}
				/>
			</div>
			<div>
				<Editor editor={refactor.editors.matchPreview}/>
			</div>
		</div>
		<div class="headers">
			<div>
				<AccelLabel for={replaceWithEditor} label="Rep%lace with"/>
			</div>
			<div>
				<label>Preview</label>
			</div>
		</div>
		<div class="editors">
			<div>
				<Editor
					bind:this={replaceWithEditor}
					editor={refactor.editors.replaceWith}
				/>
			</div>
			<div>
				<Editor editor={refactor.editors.resultPreview}/>
			</div>
		</div>
	</div>
</div>
