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

let findEditor;
let replaceWithEditor;

let formOptions = getFormOptions(refactor.options);

$: refactor.setOptions(getOptions(formOptions));

function getFormOptions(options) {
	return options;
}

function getOptions(formOptions) {
	return formOptions;
}

function onOptionsChanged() {
	
}

function onSelectPath(e) {
	refactor.selectPath(e.target.value);
}

onMount(function() {
	let teardown = [
		refactor.on("optionsChanged", onOptionsChanged),
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
