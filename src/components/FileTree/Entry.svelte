<script lang="ts">
import {onMount, tick} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import {getApp} from "components/context";
import Entry from "./Entry.svelte";

let {
	entry,
	isRoot = false,
	selectedEntry,
	level = -1,
	onmakeRoot = () => {},
	oncontextmenu = () => {},
	onopen = () => {},
	onselect = () => {},
} = $props();

let app = getApp();

let {fileTree} = app;
let expandedDirs = $state(fileTree.expandedDirs);

let {node, isDir} = entry;
let {name} = node;
let showEntry = !isRoot;
let expanded = $state();
let entries = $state([]);
let loaded = false;
let showHiddenFiles = $state(base.getPref("showHiddenFiles"));

let dirs = $derived(entries.filter(e => e.isDir));
let files = $derived(entries.filter(e => !e.isDir));

$effect(() => {
	expanded = isRoot || isDir && expandedDirs.has(entry.path);
});

let filteredEntries = $derived([...dirs, ...files].filter(function(entry) {
	return showHiddenFiles || !entry.node.name.startsWith(".");
}));

async function update() {
	({expandedDirs} = fileTree);
	
	await tick();
	
	if (expanded) {
		entries = await base.DirEntries.ls(entry.path);
	}
	
	loaded = true;
}

function toggle() {
	if (!isDir) {
		return;
	}
	
	fileTree.toggleDir(entry.path);
	
	if (!loaded) {
		update();
	}
}

function dblclick() {
	if (isDir) {
		onmakeRoot(entry);
	} else {
		onopen(entry);
	}
}

function contextmenu(e) {
	oncontextmenu({
		e,
		entry,
	});
}

function select() {
	onselect(entry);
}

$effect(() => {
	if (expanded) {
		update();
	}
});

function onPrefsUpdated() {
	showHiddenFiles = base.getPref("showHiddenFiles");
	
	update();
}

function onFsChange() {
	update();
}

let entryStyle = {
	paddingLeft: "calc(3px + 1.2em * " + level + ")",
};

let buttonStyle = {
	visibility: isDir ? "visible" : "hidden",
};

onMount(function() {
	let teardown = [
		isDir && base.on("prefsUpdated", onPrefsUpdated),
		isDir && platform.fs(entry.path).watch(onFsChange),
		isDir && fileTree.on("updateExpandedDirs", update),
	];
	
	return function() {
		for (let fn of teardown.filter(Boolean)) {
			fn();
		}
	}
});
</script>

<style lang="scss">
@use "utils";

#main {
	
}

#entry {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 2px 0;
	padding-right: 5px;
}

.selected {
	background: var(--treeEntrySelectedBackground);
}

#icon {
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

#name {
	@include utils.ellipsis;
}

#entries {
	
}

.button {
	font-size: .9em;
	line-height: 9px;
	text-align: center;
	width: 15px;
	height: 15px;
	border: 1px solid var(--treeEntryExpandContractBorder);
	border-radius: 1px;
	padding: 1px 3px;
	background: var(--treeEntryExpandContractBackground);
}
</style>

<div id="main">
	{#if showEntry}
		<div
			id="entry"
			class:selected={entry === selectedEntry}
			onmousedown={select}
			ondblclick={dblclick}
			oncontextmenu={contextmenu}
			style={inlineStyle(entryStyle)}
		>
			<div id="actions">
				<div
					class="button"
					style={inlineStyle(buttonStyle)}
					onclick={toggle}
					ondblclick={e => e.stopPropagation()}
				>
					{expanded ? "-" : "+"}
				</div>
			</div>
			<div
				id="icon"
				class:dirIcon={isDir}
				class:fileIcon={!isDir}
			></div>
			<div id="name">
				{name}
			</div>
		</div>
	{/if}
	{#if expanded}
		<div id="entries">
			{#each filteredEntries as entry (entry.path)}
				<Entry
					{entry}
					{onselect}
					{onopen}
					{oncontextmenu}
					{onmakeRoot}
					{selectedEntry}
					level={level + 1}
				/>
			{/each}
		</div>
	{/if}
</div>
