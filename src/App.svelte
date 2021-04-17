<script>
let fs = require("flowfs");

import {onMount, tick} from "svelte";

import getKeyCombo from "./utils/getKeyCombo";
import lid from "./utils/lid";
import {push} from "./utils/arrayMethods";
import langs from "./modules/langs";
import Document from "./modules/Document";
import openDialog from "./modules/ipc/openDialog/renderer";
import Toolbar from "./components/Toolbar.svelte";
import TabBar from "./components/TabBar.svelte";
import Editor from "./components/Editor.svelte";

let tabs = [];
let editorsByTabId = {};
let selectedTab = null;

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (keymap[keyCombo]) {
		functions[keymap[keyCombo]]();
	}
}

let functions = {
	async showOpenDialog() {
		let {
			canceled,
			filePaths,
		} = await openDialog({
			defaultPath: "/home/gus/projects/editor",
			properties: [
				"openFile",
				"multiSelections",
			],
		});
		
		if (canceled) {
			return;
		}
		
		for (let path of filePaths) {
			openFile(path);
		}
	},
	
	async saveCurrentFile() {
		
	},
};

let keymap = {
	"Ctrl+O": "showOpenDialog",
	"Ctrl+S": "saveCurrentFile",
};

async function openFile(path) {
	path = fs(path).path;
	
	let tab = findTabByPath(path);
	
	if (tab) {
		selectTab(tab);
		
		return;
	}
	
	let code = await fs(path).read();
	
	let newTab = {
		id: lid(),
		path,
		document: new Document(code, langs.js), // TODO detect lang
	};
	
	//console.log(newTab);
	
	tabs = push(tabs, newTab);
	
	await tick();
	
	selectTab(newTab);
}

function findTabByPath(path) {
	for (let tab of tabs) {
		if (tab.path === path) {
			return tab;
		}
	}
	
	return null;
}

function onSelectTab({detail: tab}) {
	selectTab(tab);
}

function selectTab(tab) {
	selectedTab = tab;
	
	let editor = editorsByTabId[tab.id];
	
	console.log(tab);
	console.log(editorsByTabId);
	console.log(editor);
}

onMount(async function() {
	//let code = await fs("test/repos/bluebird/js/browser/bluebird.js").read();
	//let code = await fs("test/repos/acorn/dist/bin.js").read();
	//let code = await fs("test/repos/array-find-index/index.js").read();
	
	openFile("test/repos/bluebird/js/browser/bluebird.js");
});
</script>

<svelte:window on:keydown={keydown}/>

<style type="text/scss">
@import "./css/mixins/flex-col";
@import "./css/classes/hide";

#main {
	display: grid;
	grid-template-rows: auto auto 1fr auto;
	grid-template-columns: auto 1fr auto;
	grid-template-areas:
		"toolbar toolbar toolbar"
		"left tabBar right"
		"left editor right"
		"bottom bottom bottom";
	width: 100vw;
	height: 100vh;
	user-select: none;
}

#toolbar {
	grid-area: toolbar;
}

#left {
	grid-area: left;
}

#tabBar {
	grid-area: tabBar;
}

#editor {
	grid-area: editor;
}

.tab {
	width: 100%;
	height: 100%;
}

#right {
	grid-area: right;
}

#bottom {
	grid-area: bottom;
}
</style>

<div id="main">
	<div id="toolbar">
		<Toolbar
			on:open={functions.showOpenDialog}
		/>
	</div>
	<div id="left">
		left
	</div>
	<div id="tabBar">
		<TabBar
			{tabs}
			{selectedTab}
			on:select={onSelectTab}
		/>
	</div>
	<div id="editor">
		{#each tabs as tab (tab)}
			<div class="tab" class:hide={tab !== selectedTab}>
				<Editor
					bind:this={editorsByTabId[tab.id]}
					document={tab.document}
				/>
			</div>
		{/each}
	</div>
	<div id="right">
		right
	</div>
	<div id="bottom">
		bottom
	</div>
</div>
