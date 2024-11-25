<script>
import {onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import clickElementFromAccel from "utils/dom/clickElementFromAccel";
import Accel from "components/utils/Accel.svelte";
import Spacer from "components/utils/Spacer.svelte";
import themeStyle from "components/themeStyle";

export let app;

let {entries, selectedEntries} = app;
let {mode} = app.options;

let inputValue;

let bookmarks = [];
let showHiddenFiles = base.getPref("fileChooser.showHiddenFiles");

$: filteredEntries = entries.filter(function(entry) {
	return showHiddenFiles || !entry.node.name.startsWith(".");
});

function updateEntries() {
	({entries, selectedEntry} = app);
}

function updateSelected() {
	({selectedEntries} = app);
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

function dblclick(entry) {
	app.dblclick(entry);
}

function contextmenu(e) {
	platform.showContextMenu(e, app, [
		!node.isRoot && {
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

function select(entry) {
	app.select(entry);
}

function nav(path) {
	app.nav(path);
}

function ok() {
	app.ok();
}

onMount(async function() {
	let teardown = [
		app.on("updateSelected", updateSelected),
		app.on("updateEntries", updateEntries),
	];
	
	update();
	
	bookmarks = await app.getBookmarks();
	
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
				<div class="entry" on:click={() => nav(path)}>
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
						on:mousedown={() => select(entry)}
						on:dblclick={() => dblclick(entry)}
						on:contextmenu={() => contextmenu(entry)}
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
		<button on:click={cancel}>
			<Accel label="%Cancel"/>
		</button>
		<button on:click={ok}>
			<Accel label={mode === "save" ? "%Save" : "%Open"}/>
		</button>
	</div>
</div>
