<script>
import {onMount, tick} from "svelte";

import getKeyCombo from "../../utils/getKeyCombo";
import lid from "../../utils/lid";
import {push, remove} from "../../utils/arrayMethods";
import Document from "../../modules/Document";
import Editor from "../Editor/Editor.svelte";
import Toolbar from "./Toolbar.svelte";
import TabBar from "./TabBar.svelte";

let tabs = [];
let editorsByTabId = {};
let selectedTab = null;

let keymap = {
	"Ctrl+O": "open",
	"Ctrl+S": "save",
	"Ctrl+Z": "undo",
	"Ctrl+Y": "redo",
};

let functions = {
	async open() {
		let files = await platform.open();
		
		for (let {path, code} of files) {
			openFile(path, code);
		}
	},
	
	async save() {
		if (!selectedTab) {
			return;
		}
		
		let {document, path} = selectedTab;
		
		if (path) {
			await platform.save(path, document.toString());
		} else {
			// TODO save dialog
		}
	},
	
	undo() {
		getCurrentEditor()?._undo();
	},
	
	redo() {
		getCurrentEditor()?._redo();
	},
};

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (keymap[keyCombo]) {
		functions[keymap[keyCombo]]();
	}
}

async function openFile(path, code) {
	let tab = findTabByPath(path);
	
	if (tab) {
		selectTab(tab);
		
		return;
	}
	
	let fileDetails = app.getFileDetails(code, path);
	
	if (fileDetails.hasMixedNewlines) {
		// TODO prompt to change all newlines
		// needed as fileDetails.newline.length is currently used for e.g.
		// calculating line start offsets
	}
	
	let newTab = {
		id: lid(),
		path,
		document: new Document(code, fileDetails),
	};
	
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

function getEditors() {
	return Object.values(editorsByTabId).filter(Boolean); // NOTE shouldn't have to filter it but Svelte keeps the binding around (but set to null) in some cases
}

function getCurrentEditor() {
	return editorsByTabId[selectedTab?.id];
}

function onSelectTab({detail: tab}) {
	selectTab(tab);
}

function selectTab(tab) {
	for (let editor of getEditors()) {
		editor.blur();
		editor.hide();
	}
	
	selectedTab = tab;
	
	let editor = editorsByTabId[tab.id];
	
	editor.show();
	editor.focus();
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
	
	delete editorsByTabId[tab.id];
	
	if (selectNext) {
		selectTab(selectNext);
	}
}

onMount(async function() {
	openFile("test/repos/test.js", await require("flowfs")("test/repos/test.js").read());
});
</script>

<svelte:window on:keydown={keydown}/>

<style type="text/scss">
@import "../css/mixins/flex-col";
@import "../css/classes/hide";

$border: 1px solid #AFACAA;

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
	border-bottom: $border;
}

#left {
	grid-area: left;
	border-right: $border;
}

#tabBar {
	grid-area: tabBar;
	border-bottom: $border;
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
	border-left: $border;
}

#bottom {
	grid-area: bottom;
	border-top: $border;
}
</style>

<div id="main">
	<div id="toolbar">
		<Toolbar
			on:open={functions.open}
			on:save={functions.save}
			on:new={functions._new}
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
