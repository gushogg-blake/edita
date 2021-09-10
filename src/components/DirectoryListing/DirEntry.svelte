<script>
import {getContext, onMount, createEventDispatcher} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import bluebird from "bluebird";

export let entry;
export let isRoot = false;
export let selectedEntry;
export let level = -1;

let fire = createEventDispatcher();

let app = getContext("app");

let {node, isDir} = entry;
let {name} = node;
let showEntry = !isRoot;
let expanded = isRoot ? true : false; // TODO get from store
let entries = [];
let loaded = false;
let showHiddenFiles = platform.getPref("showHiddenFiles");

$: dirs = entries.filter(e => e.isDir);
$: files = entries.filter(e => !e.isDir);

$: filteredEntries = [...dirs, ...files].filter(function(entry) {
	return showHiddenFiles || !entry.node.name.startsWith(".");
});

async function update() {
	entries = await bluebird.map(node.ls(), async function(node) {
		return {
			node,
			isDir: await node.isDir(),
		};
	});
	
	loaded = true;
}

function toggle() {
	expanded = !expanded;
	
	if (!loaded) {
		update();
	}
}

function select() {
	fire("select", entry);
}

if (expanded) {
	update();
}

function onPrefsUpdated() {
	showHiddenFiles = platform.getPref("showHiddenFiles");
}

let entryStyle = inlineStyle({
	paddingLeft: "calc(1.2em * " + level + ")",
});

onMount(function() {
	let teardown = [
		isDir && platform.on("prefsUpdated", onPrefsUpdated),
	];
	
	return function() {
		for (let fn of teardown.filter(Boolean)) {
			fn();
		}
	}
});
</script>

<style type="text/scss">
@import "mixins/ellipsis";

#main {
	
}

#entry {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 2px 0;
}

.selected {
	background: rgba(0, 0, 0, 0.1);
}

#icon {
	flex-shrink: 0;
	width: 12px;
	height: 12px;
	border-radius: 3px;
}

.dirIcon {
	background: #b9d7f1;
}

.fileIcon {
	background: #fbfbfb;
}

#name {
	@include ellipsis;
}

#entries {
	
}

.button {
	font-size: .9em;
	line-height: 9px;
	text-align: center;
	width: 15px;
	height: 15px;
	border: 1px solid #bbbbbb;
	border-radius: 1px;
	padding: 1px 3px;
	background: white;
}
</style>

<div id="main">
	{#if showEntry}
		<div
			id="entry"
			class:selected={entry === selectedEntry}
			on:click={select}
			on:dblclick={toggle}
			style={entryStyle}
		>
			{#if isDir}
				<div id="actions">
					<div
						class="button"
						on:click={toggle}
					>
						{expanded ? "-" : "+"}
					</div>
				</div>
			{/if}
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
			{#each filteredEntries as entry}
				<svelte:self
					{entry}
					on:select
					{selectedEntry}
					level={level + 1}
				/>
			{/each}
		</div>
	{/if}
</div>
