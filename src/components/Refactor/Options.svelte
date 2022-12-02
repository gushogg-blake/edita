<script>
import {onMount, createEventDispatcher} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import autoFocusAsync from "components/actions/autoFocusAsync";
import accels from "components/actions/accels";
import Accel from "components/utils/Accel.svelte";
import AccelLabel from "components/utils/AccelLabel.svelte";
import Gap from "components/utils/Gap.svelte";
import Editor from "components/Editor/Editor.svelte";

export let refactor;

let fire = createEventDispatcher();

let formOptions = getFormOptions(refactor.options);

$: refactor.setOptions(getOptions(formOptions));

function getFormOptions(options) {
	return options;
}

function getOptions(formOptions) {
	return formOptions;
}
</script>

<style lang="scss">
#main {
	
}
</style>

<div id="main">
	<AccelLabel for="searchIn" label="Search %in"/>
	
	<select bind:value={formOptions.searchIn} id="searchIn">
		<option value="currentDocument">Current document</option>
		<option value="selectedText">Selected text</option>
		<option value="openFiles">Open files</option>
		<option value="files">Files</option>
	</select>
</div>
