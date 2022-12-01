<script>
import {onMount, getContext, createEventDispatcher} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import autoFocusAsync from "components/actions/autoFocusAsync";
import accels from "components/actions/accels";
import Accel from "components/utils/Accel.svelte";
import AccelLabel from "components/utils/AccelLabel.svelte";

export let refactor;

let fire = createEventDispatcher();

let app = getContext("app");

let formOptions = {};

</script>

<style lang="scss">
#main {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 1em;
	width: 100%;
	height: 100%;
	padding: 5px;
	background: white;
}
</style>

<div id="main">
	<div id="controls">
		<div>
			<AccelLabel for="searchIn" label="Search %in"/>
			
			<select bind:value={formOptions.searchIn} id="searchIn">
				<option value="openFiles">Open files</option>
				<option value="files">Files</option>
			</select>
		</div>
		
		<input bind:value={formOptions.paths} id="paths" disabled={formOptions.searchIn !== "files"}>
	</div>
	<div id="preview">
		preview
	</div>
</div>
