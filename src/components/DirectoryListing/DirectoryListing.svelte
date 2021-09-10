<script>
import DirEntry from "./DirEntry.svelte";

export let dir;

let entry = {
	path: dir,
	isDir: true,
};
</script>

<style type="text/scss">

</style>

<div id="main">
	<DirEntry {entry} isRoot/>
</div>
