<script>
import {onMount, createEventDispatcher, getContext} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import clickElementFromAccel from "utils/dom/clickElementFromAccel";
import Accel from "components/utils/Accel.svelte";
import Spacer from "components/utils/Spacer.svelte";

export let mode;
export let entries;
export let selectedEntries;
export let bookmarks;

let fire = createEventDispatcher();

let inputValue = "";
let showHiddenFiles = base.getPref("fileChooser.showHiddenFiles");

$: filteredEntries = entries.filter(function(entry) {
	return showHiddenFiles || !entry.node.name.startsWith(".");
});

function keydown(e) {
	if (clickElementFromAccel(e)) {
		return;
	}
}
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

<div id="main">
	{#if mode === "save"}
		<div id="top">
			<input bind:value={inputValue}>
		</div>
	{/if}
	<div id="cols">
		<div id="left">
			{#each bookmarks as path}
				<div class="entry" on:click={() => fire("nav", path)}>
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
						on:mousedown={() => fire("select", entry)}
						on:dblclick={() => fire("dblclick", entry)}
						on:contextmenu={(e) => fire("contextmenu", {e, entry})}
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
		<button on:click={() => fire("cancel")}>
			<Accel label="%Cancel"/>
		</button>
		<button on:click={() => fire("ok", inputValue)}>
			<Accel label={mode === "save" ? "%Save" : "%Open"}/>
		</button>
	</div>
</div>
