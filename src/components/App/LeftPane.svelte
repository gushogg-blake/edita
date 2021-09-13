<script>
import {onMount, getContext} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import FocusablePane from "./FocusablePane.svelte";
import FileTree from "../FileTree/FileTree.svelte";

let app = getContext("app");

let {fileTree} = app;

let dirSelector;
let {rootEntry} = fileTree;

function onUpdateRootDir() {
	({rootEntry} = fileTree);
}

function openDirMenu() {
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

$: mainStyle = {
	width: 150,
};

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
	
	--scrollbarBorderColor: var(--appBackgroundColor);
	
	overflow: auto;
}
</style>

<FocusablePane>
	<div id="main" style={inlineStyle(mainStyle)}>
		<div id="top">
			{#if rootEntry}
				<div bind:this={dirSelector} id="dirSelector" on:mousedown={openDirMenu}>
					{rootEntry.node.name}
				</div>
			{/if}
		</div>
		<div id="list">
			<div id="scroll">
				<FileTree/>
			</div>
		</div>
	</div>
</FocusablePane>
