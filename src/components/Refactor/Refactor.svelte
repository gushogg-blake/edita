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
	grid-template-rows: auto 1fr;
	width: 100%;
	height: 100%;
	background: white;
}

#controls {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	padding: 8px;
}

#editors {
	display: grid;
	grid-template-rows: auto 1fr auto 1fr;
	border-top: var(--appBorder);
}

.headers, .editors {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
}

.headers {
	&:not(:first-child) {
		border-top: var(--appBorder);
	}
	
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
			
		</div>
	</div>
	<div id="editors">
		<div class="headers">
			<div>
				<AccelLabel for={matchEditor} label="%Match"/>
			</div>
			<div>
				<AccelLabel for={matchedEditor} label="M%atched"/>
			</div>
		</div>
		<div class="editors">
			<div>
				<Editor bind:this={matchEditor} bind:value={formOptions.match}/>
			</div>
			<div>
				<Editor bind:this={matchedEditor} bind:value={preview.matched}/>
			</div>
		</div>
		<div class="headers">
			<div>
				<AccelLabel for={replaceWithEditor} label="Rep%lace with"/>
			</div>
			<div>
				<AccelLabel for={refactoredEditor} label="%Preview"/>
			</div>
		</div>
		<div class="editors">
			<div>
				<Editor bind:this={replaceWithEditor} bind:value={formOptions.replaceWith}/>
			</div>
			<div>
				<Editor bind:this={refactoredEditor} bind:value={preview.refactored}/>
			</div>
		</div>
	</div>
</div>
