<script lang="ts">
import {onMount} from "svelte";
import getWheelCombo from "utils/getWheelCombo";
import Editor from "components/Editor/Editor.svelte";

let {
	tab,
} = $props();

let {platform} = window;

let editor = $state(tab.editor);
let path = $state(tab.path);
let currentPath = $state(tab.currentPath);
let entries = $state(tab.entries);

let mouseFunctions = {
	fileZoom(wheelCombo) {
		if (wheelCombo.dir === "up") {
			tab.zoomIn();
		} else {
			tab.zoomOut();
		}
	},
};

function wheel(e) {
	let wheelCombo = getWheelCombo(e);
	let fnName = base.prefs.tabMouseMap[wheelCombo.wheelCombo];
	
	if (fnName) {
		e.preventDefault();
		e.stopPropagation();
		
		mouseFunctions[fnName](wheelCombo);
	}
}

function switchToFile(entry) {
	tab.switchToFile(entry);
}

function openFile(entry) {
	tab.openFile(entry);
}

function openContextMenuForFile(entry) {
	
}

function onZoomChange() {
	({path, currentPath} = tab);
	
	entries = [];
}

function onUpdateDirListing() {
	({entries} = tab);
}

onMount(function() {
	let teardown = [
		tab.on("zoomChange", onZoomChange),
		tab.on("updateDirListing", onUpdateDirListing),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
@use "utils";

#main, #editor, #files {
	width: 100%;
	height: 100%;
}

#breadcrumbs {
	display: flex;
	gap: .6em;
	border-bottom: var(--appBorder);
	padding: .5em;
	
	.breadcrumb {
		border-radius: 3px;
		padding: .35em .7em;
		box-shadow: 1px 1px 1px 0 #00000020;
		//background: white;
	}
}

#list {
	display: flex;
	align-content: flex-start;
	justify-content: flex-start;
	flex-wrap: wrap;
	gap: 1em;
	padding: 1em;
}

.entry {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: .4em;
	width: 120px;
	cursor: pointer;
	
	&:hover {
		text-decoration: underline;
	}
	
	.name {
		text-align: center;
		word-break: break-all;
		max-width: 120px;
	}
}

.icon {
	width: 48px;
	height: 48px;
	border-radius: 5px;
}

.dirIcon {
	background: var(--dirEntryFolderBackground);
}

.fileIcon {
	background: var(--dirEntryFileBackground);
}
</style>

<div id="main" onwheel={wheel}>
	<div id="editor" class:hide={currentPath !== path}>
		<Editor {editor}/>
	</div>
	<div id="files" class:hide={currentPath === path}>
		{#if currentPath}
			<div id="breadcrumbs">
				{#each currentPath.split(platform.path.sep).filter(Boolean) as part}
					<div class="breadcrumb">
						{part}
					</div>
				{/each}
			</div>
		{/if}
		<div id="list">
			{#each entries as entry}
				<div
					class="entry"
					onclick={(e) => switchToFile(entry)}
					onauxclick={(e) => openFile(entry)}
					oncontextmenu={(e) => openContextMenuForFile(entry)}
				>
					<div class="icon {entry.isDir ? "dirIcon" : "fileIcon"}"></div>
					<div class="name">
						{entry.node.name}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
