<script>
import {onMount} from "svelte";
import Editor from "components/Editor/Editor.svelte";

export let tab;

let {platform} = window;

let {
	originalPath,
	currentPath,
	files: nodes,
} = tab;

$: dirs = nodes.filter(n => n.isDir);
$: files = nodes.filter(n => n.isFile);

function wheel(e) {
	if (!e.ctrlKey) {
		return;
	}
	
	e.stopPropagation();
	
	let dir = e.deltaY > 0 ? "out" : "in";
	
	if (dir === "out") {
		tab.zoomOut();
	} else {
		tab.zoomIn();
	}
}

function switchToFile(file) {
	tab.switchToFile(file);
}

function openFile(file) {
	tab.openFile(file);
}

function openContextMenuForFile(file) {
	
}

function onZoomChange() {
	({currentPath} = tab);
	
	nodes = [];
}

function onUpdateDirListing() {
	({files: nodes} = tab);
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

<style type="text/scss">
@import "../../css/classes/hide";

#main, #editor, #files {
	width: 100%;
	height: 100%;
}

#main {
	background: white;
}

#editor {
	
}

#files {
}

#breadcrumbs {
	display: flex;
	gap: .6em;
	border-bottom: 1px solid #d0d0d0;
	padding: .5em;
	background: #eeeeee;
	
	.breadcrumb {
		border-radius: 3px;
		padding: .35em .7em;
		box-shadow: 1px 1px 1px 0 #00000020;
		background: white;
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

.file {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: .4em;
	width: 120px;
	cursor: pointer;
	
	&:hover {
		text-decoration: underline;
	}
}

.icon {
	width: 48px;
	height: 48px;
	border-radius: 5px;
}

.dirIcon {
	background: #b9d7f1;
}

.fileIcon {
	background: #eeeeee;
}
</style>

<div id="main" on:wheel={wheel}>
	<div id="editor" class:hide={currentPath !== originalPath}>
		<Editor editor={tab.editor}/>
	</div>
	<div id="files" class:hide={currentPath === originalPath}>
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
			{#each [...dirs, ...files] as file}
				<div
					class="file"
					on:click={(e) => switchToFile(file)}
					on:auxclick={(e) => openFile(file)}
					on:contextmenu={(e) => openContextMenuForFile(file)}
				>
					<div class="icon {file.isDir ? "dirIcon" : "fileIcon"}">
						
					</div>
					<div class="name">
						{file.name}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
