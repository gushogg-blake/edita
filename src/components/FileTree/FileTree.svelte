<script lang="ts">
import {getContext, onMount, tick} from "svelte";
import Entry from "./Entry.svelte";

let app = getContext("app");

let {fileTree} = app;

let rootEntry = $state(fileTree.rootEntry);
let selectedEntry = $state(null);

function select(entry) {
	selectedEntry = entry;
}

function open(entry) {
	app.fileOperations.openPath(entry.path);
}

function contextmenu({e, entry}) {
	let {path, isDir} = entry;
	
	platform.showContextMenu(e, app, [
		{
			label: "Find",
			
			onClick() {
				app.findInFiles([path]);
			},
		},
		
		{
			label: "Replace",
			
			onClick() {
				app.replaceInFiles([path]);
			},
		},
		
		{
			label: "Refactor",
			
			onClick() {
				app.refactor([path]);
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
				if (!await confirm("Delete " + path + "?")) {
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

function onMakeRoot(entry) {
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
			onselect={select}
			onopen={open}
			oncontextmenu={contextmenu}
			onmakeRoot={onMakeRoot}
			{selectedEntry}
		/>
	{/if}
</div>
