<script lang="ts">
import {onMount, createEventDispatcher, getContext, tick} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import sleep from "utils/sleep";
import clickElementFromAccel from "utils/dom/clickElementFromAccel";
import themeStyle from "components/themeStyle";
import Accel from "components/utils/Accel.svelte";
import Spacer from "components/utils/Spacer.svelte";
import Entry from "./Entry.svelte";

export let app;

let {
	mode,
	dir,
	entries,
	selectedEntries,
	name,
	bookmarks,
	breadcrumbs,
} = app;

let showHiddenFiles = base.getPref("fileChooser.showHiddenFiles");

let input;
let inputValue = name;
let newFolderEntry = null;

function updateMain() {
	({dir, entries, breadcrumbs, selectedEntries} = app);
	
	input?.focus();
}

function updateSelected() {
	({selectedEntries} = app);
}

function updateBookmarks() {
	({bookmarks} = app);
}

function cancel() {
	window.close();
}

function toggleShowHiddenFiles() {
	showHiddenFiles = !showHiddenFiles;
	
	base.setPref("fileChooser.showHiddenFiles", showHiddenFiles);
}

let functions = {
	close() {
		if (platform.isDialogWindow) {
			window.close();
		}
	},
	
	ok() {
		app.ok(inputValue);
	},
	
	toggleShowHiddenFiles,
};

let keymap = {
	"Escape": "close",
	"Enter": "ok",
	"Ctrl+H": "toggleShowHiddenFiles",
};

function keydown(e) {
	if (clickElementFromAccel(e)) {
		return;
	}
	
	let {keyCombo} = getKeyCombo(e);
	let fnName = keymap[keyCombo];
	
	if (fnName) {
		functions[fnName]();
	}
}

function newFolder() {
	app.newFolder();
}

function onNewFolder(entry) {
	newFolderEntry = entry;
}

function onCancelNewFolder(entry) {
	newFolderEntry = null;
}

function onNewFolderCreated() {
	newFolderEntry = null;
}

$: filteredEntries = entries.filter(function(entry) {
	return showHiddenFiles || !entry.node.name.startsWith(".");
});

onMount(async function() {
	let teardown = [
		app.on("updateMain", updateMain),
		app.on("updateSelected", updateSelected),
		app.on("updateBookmarks", updateBookmarks),
		app.on("newFolder", onNewFolder),
		app.on("newFolderCreated", onNewFolderCreated),
		app.on("cancelNewFolder", onCancelNewFolder),
	];
	
	input?.focus();
	
	if (name) {
		if (name.includes(".")) {
			let i = name.indexOf(".");
			
			input.setSelectionRange(0, i);
		} else {
			input.select();
		}
	}
	
	await sleep(100);
	
	//input?.focus();
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<svelte:window on:keydown={keydown}/>

<style lang="scss">
@use "utils";

#main {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
}

#top {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 6px;
}

#input {
	
}

input {
	width: 100%;
}

#cols {
	display: flex;
	align-items: stretch;
	flex-grow: 1;
}

#left {
	
}

#right {
	flex-grow: 1;
	background: var(--fileChooserBackground);
}

.scroll {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	overflow-y: auto;
}

.selected {
	background: var(--treeEntrySelectedBackground);
}

.entry {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 4px 3px;
	padding-right: 5px;
}

.icon {
	flex-shrink: 0;
	width: 12px;
	height: 12px;
	border-radius: 3px;
}

.dirIcon {
	background: var(--dirEntryFolderBackground);
}

.fileIcon {
	background: var(--dirEntryFileBackground);
}

.name {
	@include utils.ellipsis;
}

.scrollWrapper {
	position: relative;
}

#breadcrumbs {
	display: flex;
	gap: 6px;
}

.breadcrumb {
	border: 1px solid gray;
	border-radius: 3px;
	padding: 6px 12px;
}

#controls {
	display: flex;
	gap: 6px;
	padding: 6px;
}

.flex {
	display: flex;
	gap: 6px;
}
</style>

<div id="main" class="edita" style={themeStyle(base.theme.app)}>
	<div id="top">
		{#if mode === "save"}
			<div id="input">
				<input bind:value={inputValue} bind:this={input}>
			</div>
		{/if}
		<div class="flex">
			<div id="breadcrumbs">
				{#each breadcrumbs as node}
					<div class="breadcrumb" on:click={() => app.nav(node.path)}>
						{node.name}
					</div>
				{/each}
			</div>
			<Spacer/>
			<button on:click={newFolder}>+</button>
		</div>
	</div>
	<div id="cols">
		<div id="left">
			{#each bookmarks as dir}
				<div class="entry" on:click={() => app.nav(dir)}>
					<div class="icon dirIcon"></div>
					<div class="name">
						{platform.fs(dir).name}
					</div>
				</div>
			{/each}
		</div>
		<div class="scrollWrapper" id="right">
			<div class="scroll">
				{#if newFolderEntry}
					<Entry {app} entry={newFolderEntry}/>
				{/if}
				{#each filteredEntries as entry (entry)}
					<Entry {app} {entry} selected={selectedEntries.includes(entry)}/>
				{/each}
			</div>
		</div>
	</div>
	<div id="controls">
		<Spacer/>
		<button on:click={() => app.cancel()}>
			<Accel label="%Cancel"/>
		</button>
		<button on:click={() => app.ok(inputValue)}>
			<Accel label={mode === "save" ? "%Save" : "%Open"}/>
		</button>
	</div>
</div>
