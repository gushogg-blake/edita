<script>
import {onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import clickElementFromAccel from "utils/dom/clickElementFromAccel";
import themeStyle from "components/themeStyle";

export let app;

let {type} = app.options;

let inputValue;
let selectedEntry;

let bookmarks = [];
let entries = [];
let loaded = false;
let showHiddenFiles = base.getPref("fileChooser.showHiddenFiles");

$: filteredEntries = entries.filter(function(entry) {
	return showHiddenFiles || !entry.node.name.startsWith(".");
});

async function update() {
	entries = await base.DirEntries.ls(app.path);
	
	loaded = true;
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
		
		!node.isRoot && {
			label: "Delete...",
			
			async onClick() {
				if (!await confirm("Delete " + path + "?")) {
					return;
				}
				
				platform.fs(path).rmrf();
				fileTree.setRootDir(node.parent.path);
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

onMount(async function() {
	let teardown = [
		app.on("select", entry => selectedEntry = entry),
		app.on("nav", update),
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
	width: 100%;
	height: 100%;
}

#cols {
	display: flex;
}

#left {
	
}

#right {
	flex-grow: 1;
}

.selected {
	background: var(--treeEntrySelectedBackground);
}

.entry {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 2px 0;
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
</style>

<div id="main" class="edita" style={themeStyle(base.theme.app)}>
	{#if type === "save"}
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
		<div id="right">
			{#each filteredEntries as entry}
				<div
					class="entry"
					class:selected={entry === selectedEntry}
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
