<script>
import {onMount} from "svelte";
import Editor from "../Editor/Editor.svelte";

export let tab;

let {
	originalPath,
	currentPath,
	files,
} = tab;

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
	
	files = [];
}

function onUpdateDirListing() {
	({files} = tab);
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

#editor {
	
}

#files {
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
	background: #eeeeee;
}
</style>

<div id="main" on:wheel={wheel}>
	<div id="editor" class:hide={currentPath !== originalPath}>
		<Editor editor={tab.editor}/>
	</div>
	<div id="files" class:hide={currentPath === originalPath}>
		{#each files as file}
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
