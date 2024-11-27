<script>
import {onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import themeStyle from "components/themeStyle";
import FileChooser from "components/FileChooser.svelte";

export let app;

let {entries, selectedEntries, name} = app;
let {mode} = app.options;

let bookmarks = [];
let showHiddenFiles = base.getPref("fileChooser.showHiddenFiles");

function updateEntries() {
	({entries} = app);
}

function updateSelected() {
	({selectedEntries} = app);
}

function cancel() {
	window.close();
}

let functions = {
	close() {
		window.close();
	},
};

let keymap = {
	"Escape": "close",
};

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	let fnName = keymap[keyCombo];
	
	if (fnName) {
		functions[fnName]();
	}
}

onMount(async function() {
	let teardown = [
		app.on("updateSelected", updateSelected),
		app.on("updateEntries", updateEntries),
	];
	
	bookmarks = await app.getBookmarks();
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<svelte:window on:keydown={keydown}/>

<style lang="scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<div id="main" class="edita" style={themeStyle(base.theme.app)}>
	<FileChooser
		{mode}
		{entries}
		{selectedEntries}
		{bookmarks}
		{showHiddenFiles}
	/>
</div>
