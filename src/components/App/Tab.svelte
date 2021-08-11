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

#main {
	width: 100%;
	height: 100%;
}

#editor {
	width: 100%;
	height: 100%;
}

#files {
	width: 100%;
	height: 100%;
}
</style>

<div id="main" on:wheel={wheel}>
	<div id="editor" class:hide={currentPath !== originalPath}>
		<Editor editor={tab.editor}/>
	</div>
	<div id="files" class:hide={currentPath === originalPath}>
		{#each files as file}
			<div class="file">
				{file}
			</div>
		{/each}
	</div>
</div>
