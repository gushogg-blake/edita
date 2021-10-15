<script>
import {onMount, getContext} from "svelte";
import FileTree from "components/FileTree/FileTree.svelte";

let app = getContext("app");

let {fileTree} = app;

let dirSelector;
let {rootEntry} = fileTree;
let background;

function onUpdateRootDir() {
	({rootEntry} = fileTree);
}

function openDirMenu(e) {
	if (e.button !== 0) {
		return;
	}
	
	if (!rootEntry) {
		return;
	}
	
	platform.showContextMenuForElement(dirSelector, rootEntry.node.parents.map(function(node) {
		return {
			label: node.name,
			
			onClick() {
				fileTree.setRootDir(node.path);
			},
		};
	}));
}

function contextmenu(e) {
	if (!rootEntry) {
		return;
	}
	
	let {node, path} = rootEntry;
	
	platform.showContextMenu(e, [
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
				if (!await platform.confirm("Delete " + path + "?")) {
					return;
				}
				
				platform.fs(path).rmrf();
				fileTree.setRootDir(node.parent.path);
			},
		},
	].filter(Boolean));
}

function wheel(e) {
	if (!e.ctrlKey) {
		return;
	}
	
	e.preventDefault();
	
	if (e.deltaY > 0) {
		fileTree.up();
	}
}

function dblclickBackground(e) {
	if (e.target !== background) {
		return;
	}
	
	fileTree.setRootDir(rootEntry.node.parent.path);
}

onMount(async function() {
	let teardown = [
		fileTree.on("updateRootDir", onUpdateRootDir),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style type="text/scss">
@import "mixins/abs-sticky";

#main {
	display: grid;
	grid-template-rows: auto 1fr;
	height: 100%;
}

#top {
	padding: 3px;
}

#dirSelector {
	font-weight: bold;
	padding: 5px;
}

#list {
	position: relative;
}

#scroll {
	@include abs-sticky;
	
	--scrollbarBackgroundColor: var(--appBackgroundColor);
	
	overflow: auto;
	
	&:not(:hover)::-webkit-scrollbar-thumb {
		display: none;
	}
}
</style>

<div id="main">
	<div id="top">
		{#if rootEntry}
			<div
				bind:this={dirSelector}
				id="dirSelector"
				on:mousedown={openDirMenu}
				on:contextmenu={contextmenu}
			>
				{rootEntry.node.name}
			</div>
		{/if}
	</div>
	<div id="list" on:wheel={wheel}>
		<div
			bind:this={background}
			id="scroll"
			on:dblclick={dblclickBackground}
		>
			<FileTree/>
		</div>
	</div>
</div>
