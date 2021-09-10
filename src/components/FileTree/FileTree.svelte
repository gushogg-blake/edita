<script>
import {getContext, onMount, tick} from "svelte";
import Entry from "./Entry.svelte";

let app = getContext("app");

let {fileTree} = app;

let rootEntry;
let selectedEntry = null;

setRootDir();

function select({detail: entry}) {
	selectedEntry = entry;
}

function open({detail: entry}) {
	app.openFile(entry.path);
}

function contextmenu({detail: {e, entry}}) {
	fileTree.showContextMenuForEntry(e, entry);
}

async function setRootDir() {
	rootEntry = null;
	
	await tick();
	
	rootEntry = await fileTree.getRootEntry();
}

onMount(async function() {
	let teardown = [
		fileTree.on("updateRootDir", setRootDir),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style type="text/scss">

</style>

<div id="main">
	{#if rootEntry}
		<Entry
			entry={rootEntry}
			isRoot
			on:select={select}
			on:open={open}
			on:contextmenu={contextmenu}
			{selectedEntry}
		/>
	{/if}
</div>
