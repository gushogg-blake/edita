<script>
import DirEntry from "./DirEntry.svelte";

export let dir;

let selectedEntry = null;

let rootEntry = {
	node: platform.fs(dir),
	isDir: true,
};

function select({detail: entry}) {
	selectedEntry = entry;
}
</script>

<style type="text/scss">

</style>

<div id="main">
	<DirEntry
		entry={rootEntry}
		isRoot
		on:select={select}
		{selectedEntry}
	/>
</div>
