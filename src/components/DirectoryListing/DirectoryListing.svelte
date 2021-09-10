<script>
import {getContext} from "svelte";
import DirEntry from "./DirEntry.svelte";

export let dir;

let app = getContext("app");

let selectedEntry = null;

let rootEntry = {
	path: dir,
	node: platform.fs(dir),
	isDir: true,
};

function select({detail: entry}) {
	selectedEntry = entry;
}

function open({detail: entry}) {
	app.openFile(entry.path);
}

function contextmenu({detail: {e, entry}}) {
	app.showContextMenuForDirEntry(e, entry);
}
</script>

<style type="text/scss">

</style>

<div id="main">
	<DirEntry
		entry={rootEntry}
		isRoot
		on:select={select}
		on:open={open}
		on:contextmenu={contextmenu}
		{selectedEntry}
	/>
</div>
