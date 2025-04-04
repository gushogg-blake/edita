<script lang="ts">
import {onMount} from "svelte";
import {getApp} from "components/context";
import FileTree from "components/FileTree/FileTree.svelte";

let app = getApp();

let {fileTree} = app;

let dirSelector: HTMLElement = $state();
let rootEntry = $state(fileTree.rootEntry);
let background = $state();

function onUpdateRootDir() {
	({rootEntry} = fileTree);
}

function openDirMenu(e) {
	if (e.button !== 0) {
		return;
	}
	
	platform.showContextMenuForElement(app, dirSelector, rootEntry.node.parents.map(function(node) {
		return {
			label: node.name,
			
			onClick() {
				fileTree.setRootDir(node.path);
			},
		};
	}));
}

function contextmenu(e) {
	let {node, path} = rootEntry;
	
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

onMount(function() {
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

<style lang="scss">
@use "utils";

#main {
	display: grid;
	grid-template-rows: auto 1fr;
	height: 100%;
}

#top {
	//padding: 3px;
}

#dirSelector {
	font-weight: bold;
	padding: 5px;
}

#list {
	position: relative;
}

#scroll {
	@include utils.abs-sticky;
	@include utils.scrollbar-on-hover;
	
	--scrollbarBackground: var(--appBackground);
	
	padding-bottom: 1em;
	overflow: auto;
}
</style>

<div id="main">
	<div id="top">
		<div
			bind:this={dirSelector}
			id="dirSelector"
			onmousedown={openDirMenu}
			oncontextmenu={contextmenu}
			title={rootEntry.node.path}
		>
			{rootEntry.node.name}
		</div>
	</div>
	<div id="list" onwheel={wheel}>
		<div
			bind:this={background}
			id="scroll"
			ondblclick={dblclickBackground}
		>
			<FileTree/>
		</div>
	</div>
</div>
