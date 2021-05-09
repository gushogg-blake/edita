<script>
let fs = require("flowfs");

import {onMount, tick} from "svelte";

import getKeyCombo from "../utils/getKeyCombo";
import lid from "../utils/lid";
import {push, remove} from "../utils/arrayMethods";
import getFileDetails from "../modules/utils/getFileDetails";
import langs from "../modules/langs";
import Document from "../modules/Document";
import openDialog from "../modules/ipc/openDialog/renderer";
import prefs from "../stores/prefs";
import Toolbar from "../components/Toolbar.svelte";
import TabBar from "../components/TabBar.svelte";
import Editor from "../components/Editor/Editor.svelte";

prefs.init();

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
		if (!selectedTab) {
			return;
		}
		
		let {document, path} = selectedTab;
		
		if (path) {
			await fs(path).write(document.toString());
		} else {
			// TODO save dialog
		}
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
	
	let fileDetails = getFileDetails($prefs, code, path);
	
	if (fileDetails.hasMixedNewlines) {
		// TODO prompt to change all newlines
	}
	
	let newTab = {
		id: lid(),
		path,
		document: new Document(code, fileDetails),
	};
	
	//console.log(newTab);
	
	tabs = push(tabs, newTab);
	
	await tick(); // wait for Editor to be created
	
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

async function selectTab(tab) {
	selectedTab = tab;
	
	let editor = editorsByTabId[tab.id];
	
	await tick();
	
	editor.show();
}

function onCloseTab({detail: tab}) {
	closeTab(tab);
}

function closeTab(tab) {
	// TODO check if modified
	
	let selectNext = null;
	
	if (selectedTab === tab) {
		let index = tabs.indexOf(tab);
		
		if (index > 0) {
			selectNext = tabs[index - 1];
		} else if (index < tabs.length - 1) {
			selectNext = tabs[index + 1];
		}
	}
	
	tabs = remove(tabs, tab);
	
	if (selectNext) {
		selectTab(selectNext);
	}
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
@import "../css/mixins/flex-col";
@import "../css/classes/hide";

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
	border-bottom: 1px solid #AFACAA;
}

#left {
	grid-area: left;
}

#tabBar {
	grid-area: tabBar;
	border-bottom: 1px solid #AFACAA;
}

#editor {
	display: grid;
	grid-template-rows: 1fr;
	grid-template-columns: 1fr;
	grid-area: editor;
}

.tab {
	display: grid;
	grid-template-rows: 1fr;
	grid-template-columns: 1fr;
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
			on:close={onCloseTab}
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
