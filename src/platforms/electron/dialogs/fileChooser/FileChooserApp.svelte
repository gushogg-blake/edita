<script>
import {onMount, createEventDispatcher, getContext} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import clickElementFromAccel from "utils/dom/clickElementFromAccel";
import themeStyle from "components/themeStyle";
import Accel from "components/utils/Accel.svelte";
import Spacer from "components/utils/Spacer.svelte";
//import FileChooser from "components/FileChooser.svelte";

export let app;

let inputValue = "";

let {entries, selectedEntries, name, bookmarks} = app;
let {mode} = app.options;
let showHiddenFiles = base.getPref("fileChooser.showHiddenFiles");

function updateEntries() {
	({entries} = app);
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

let functions = {
	close() {
		window.close();
	},
};

let keymap = {
	"Escape": "close",
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

$: filteredEntries = entries.filter(function(entry) {
	return showHiddenFiles || !entry.node.name.startsWith(".");
});

onMount(async function() {
	let teardown = [
		app.on("updateSelected", updateSelected),
		app.on("updateEntries", updateEntries),
		app.on("updateBookmarks", updateBookmarks),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<svelte:window on:keydown={keydown}/>

<style lang="scss">
@import "mixins/ellipsis";

#main {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
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
	@include ellipsis;
}

.scrollWrapper {
	position: relative;
}
</style>

<div id="main" class="edita" style={themeStyle(base.theme.app)}>
	{#if mode === "save"}
		<div id="top">
			<input bind:value={inputValue}>
		</div>
	{/if}
	<div id="cols">
		<div id="left">
			{#each bookmarks as path}
				<div class="entry" on:click={() => app.nav(path)}>
					<div class="icon dirIcon"></div>
					<div class="name">
						{platform.fs(path).name}
					</div>
				</div>
			{/each}
		</div>
		<div class="scrollWrapper" id="right">
			<div class="scroll">
				{#each filteredEntries as entry}
					<div
						class="entry"
						class:selected={selectedEntries.includes(entry)}
						on:mousedown={() => app.select(entry)}
						on:dblclick={() => app.dblclick(entry)}
						on:contextmenu={(e) => contextmenu(e, entry)}
					>
						<div
							class="icon"
							class:dirIcon={entry.isDir}
							class:fileIcon={!entry.isDir}
						></div>
						<div class="name">
							{entry.node.name}
						</div>
					</div>
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
