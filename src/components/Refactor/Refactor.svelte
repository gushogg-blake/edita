<script>
import {onMount, getContext, createEventDispatcher} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import accels from "components/actions/accels";
import Accel from "components/utils/Accel.svelte";
import AccelLabel from "components/utils/AccelLabel.svelte";
import Gap from "components/utils/Gap.svelte";
import Editor from "components/Editor/Editor.svelte";

export let refactor;

let fire = createEventDispatcher();

let app = getContext("app");

let matchEditor;
let matchedEditor;
let replaceWithEditor;
let refactoredEditor;

let formOptions = getFormOptions(refactor.options);

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

function onOptionsChange() {
	
}

onMount(function() {
	let teardown = [
		refactor.on("optionsChanged", onOptionsChange),
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
	grid-template-rows: auto 1fr 1fr;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	width: 100%;
	height: 100%;
	background: white;
}

#options {
	padding: 8px;
}

#editors {
	display: grid;
	grid-template-columns: auto 1fr;
}

.editor {
	--inputBorder: 0;
	
	display: grid;
	grid-template-rows: auto 1fr;
}

.header {
	background: var(--appBackground);
}
</style>

<div id="main">
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
		
	</div>
	<div class="editor">
		<div class="header">
			<AccelLabel for={matchEditor} label="%Match"/>
		</div>
		<div>
			<Editor bind:this={matchEditor} bind:value={formOptions.match}/>
		</div>
	</div>
	<div class="editor">
		<div class="header">
			<AccelLabel for={matchedEditor} label="M%atched"/>
		</div>
		<div>
			<Editor bind:this={matchedEditor} bind:value={preview.matched}/>
		</div>
	</div>
	<div class="editor">
		<div class="header">
			<AccelLabel for={replaceWithEditor} label="Rep%lace with"/>
		</div>
		<div>
			<Editor bind:this={replaceWithEditor} bind:value={formOptions.replaceWith}/>
		</div>
	</div>
	<div class="editor">
		<div class="header">
			<AccelLabel for={refactoredEditor} label="Refa%ctored"/>
		</div>
		<div>
			<Editor bind:this={refactoredEditor} bind:value={preview.refactored}/>
		</div>
	</div>
</div>
