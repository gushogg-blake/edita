<script>
import {onMount, setContext, getContext, createEventDispatcher, tick} from "svelte";

export let app;
export let entry;
export let selected;

let {isNew, name} = entry;

let nameInput;
let nameInputValue = name || "";
let renaming = false;

function update() {
	({name} = entry);
}

function nameInputKeydown(e) {
	if (e.key === "Enter") {
		rename();
	}
}

function rename() {
	if (nameInputValue.trim().length > 0) {
		entry.rename(nameInputValue);
	} else {
		// TODO ?
	}
}

async function onRequestRename() {
	renaming = true;
	
	await tick();
	
	nameInput?.focus();
}

function mousedown(e, entry) {
	if (e.ctrlKey) {
		app.toggleSelect(entry);
	} else {
		app.select(entry);
	}
}

function onBlur() {
	rename();
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
@import "mixins/ellipsis";

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
	@include ellipsis;
}
</style>

<div
	id="main"
	class:selected
	on:mousedown={(e) => mousedown(e, entry)}
	on:dblclick={() => app.dblclick(entry)}
	on:contextmenu={(e) => contextmenu(e, entry)}
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
				on:keydown={nameInputKeydown}
				on:blur={onBlur}
			>
		</div>
	{:else}
		<div id="name">
			{name}
		</div>
	{/if}
</div>
