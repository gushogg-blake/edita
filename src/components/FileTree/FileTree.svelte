<script>
import {getContext, onMount, tick} from "svelte";
import Entry from "./Entry.svelte";

let app = getContext("app");

let {fileTree} = app;

let {rootEntry} = fileTree;
let selectedEntry = null;

function select({detail: entry}) {
	selectedEntry = entry;
}

function open({detail: entry}) {
	app.openPath(entry.path);
}

function contextmenu({detail: {e, entry}}) {
	let {path, isDir} = entry;
	
	platform.showContextMenu(e, app, [
		{
			label: "Find...",
			
			onClick() {
				app.findInFiles([path]);
			},
		},
		
		{
			label: "Replace...",
			
			onClick() {
				app.replaceInFiles([path]);
			},
		},
		
		isDir && {
			label: "Make this folder root",
			
			onClick() {
				fileTree.setRootDir(path);
			},
		},
		
		{
			label: "Delete...",
			
			async onClick() {
				if (!await platform.confirm("Delete " + path + "?")) {
					return;
				}
				
				platform.fs(path).rmrf();
			},
		},
	].filter(Boolean));
}

async function onUpdateRootDir() {
	rootEntry = null;
	
	await tick();
	
	({rootEntry} = fileTree);
}

function onMakeRoot({detail: entry}) {
	fileTree.setRootDir(entry.path);
}

onMount(async function() {
	let teardown = [
		fileTree.on("updateRootDir", onUpdateRootDir),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">

</style>

<div id="main">
	{#if rootEntry}
		<Entry
			entry={rootEntry}
			isRoot
			on:select={select}
			on:open={open}
			on:contextmenu={contextmenu}
			on:makeRoot={onMakeRoot}
			{selectedEntry}
		/>
	{/if}
</div>
