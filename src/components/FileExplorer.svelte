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

<style lang="scss">
@import "mixins/abs-sticky";

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
	@include abs-sticky;
	
	--scrollbarBackground: var(--appBackground);
	
	overflow: auto;
	
	&:not(:hover)::-webkit-scrollbar-thumb {
		display: none;
	}
}
</style>

<div id="main">
	<div id="top">
		<div
			bind:this={dirSelector}
			id="dirSelector"
			on:mousedown={openDirMenu}
			on:contextmenu={contextmenu}
			title={rootEntry.node.path}
		>
			{rootEntry.node.name}
		</div>
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
