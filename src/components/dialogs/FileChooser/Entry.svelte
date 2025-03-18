<script lang="ts">
import {onMount, setContext, getContext, createEventDispatcher, tick} from "svelte";

let {
	app,
	entry,
	selected,
} = $props();

let isNew = $state(entry.isNew);
let name = $state(entry.name);

let nameInput = $state();
let nameInputValue = $state(name || "");
let renaming = $state(false);

function update() {
	({name} = entry);
}

function nameInputKeydown(e) {
	if (e.key === "Enter") {
		e.stopPropagation();
		
		rename();
	}
	
	if (e.key === "Escape") {
		e.stopPropagation();
		
		entry.cancelRename();
	}
}

function rename() {
	if (nameInputValue.trim().length > 0) {
		entry.rename(nameInputValue);
	} else {
		
	}
}

async function onRequestRename() {
	renaming = true;
	
	await tick();
	
	nameInput?.focus();
}

async function onCancelRename() {
	renaming = false;
}

function mousedown(e, entry) {
	if (e.ctrlKey) {
		app.toggleSelect(entry);
	} else {
		app.select(entry);
	}
}

function onBlur() {
	entry.cancelRename();
}

onMount(function() {
	let teardown = [
		entry.on("requestRename", onRequestRename),
		entry.on("update", update),
	];
	
	nameInput?.focus();
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
@use "utils";

#main {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 4px 3px;
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
</style>

<div
	id="main"
	class:selected
	onmousedown={(e) => mousedown(e, entry)}
	ondblclick={() => app.dblclick(entry)}
	oncontextmenu={(e) => contextmenu(e, entry)}
>
	<div
		id="icon"
		class:dirIcon={entry.isDir}
		class:fileIcon={!entry.isDir}
	></div>
	{#if isNew || renaming}
		<div id="input">
			<input
				bind:this={nameInput}
				bind:value={nameInputValue}
				onkeydown={nameInputKeydown}
				onblur={onBlur}
			>
		</div>
	{:else}
		<div id="name">
			{name}
		</div>
	{/if}
</div>
