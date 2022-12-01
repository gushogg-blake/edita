<script>
import {onMount, createEventDispatcher} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import autoFocusAsync from "components/actions/autoFocusAsync";
import accels from "components/actions/accels";
import Accel from "components/utils/Accel.svelte";
import AccelLabel from "components/utils/AccelLabel.svelte";

export let options;

let fire = createEventDispatcher();

let formOptions = {};

</script>

<style lang="scss">
#main {
	
}
</style>

<div id="main">
	<div>
		<AccelLabel for="searchIn" label="Search %in"/>
		
		<select bind:value={formOptions.searchIn} id="searchIn">
			<option value="openFiles">Open files</option>
			<option value="files">Files</option>
		</select>
	</div>
	
	<input bind:value={formOptions.paths} id="paths" disabled={formOptions.searchIn !== "files"}>
</div>
