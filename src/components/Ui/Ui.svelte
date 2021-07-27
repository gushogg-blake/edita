<script>
import {onMount, tick} from "svelte";

import getKeyCombo from "../../utils/getKeyCombo";
import lid from "../../utils/lid";
import {push, remove} from "../../utils/arrayMethods";
import Document from "../../modules/Document";
import Editor from "../Editor/Editor.svelte";
import Toolbar from "./Toolbar.svelte";
import TabBar from "./TabBar.svelte";
import LeftPane from "./LeftPane.svelte";
import RightPane from "./RightPane.svelte";
import FindBar from "./FindBar.svelte";

let tabs = [];
let editorsByTabId = {};
let selectedTab = null;

let showingLeftPane = true;
let showingRightPane = true;
let showingBottomPane = true;
let showingFindBar = false;

let keymap = {
	"Ctrl+O": "open",
	"Ctrl+S": "save",
	"Ctrl+Z": "undo",
	"Ctrl+Y": "redo",
	"Ctrl+F": "find",
	"Ctrl+Shift+F": "findInOpenFiles",
	"Ctrl+H": "findAndReplace",
	"Ctrl+Shift+H": "findAndReplaceInOpenFiles",
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
		getCurrentEditor()?.undo();
	},
	
	redo() {
		getCurrentEditor()?.redo();
	},
	
	find() {
		if (!getCurrentEditor()) {
			return;
		}
		
		showFindBar();
	},
	
	findInOpenFiles() {
		if (platform.showFindDialog) {
			platform.showFindDialog({
				search: "openFiles",
			});
		} else {
			// TODO
		}
	},
	
	findAndReplace() {
		if (platform.showFindDialog) {
			platform.showFindDialog({
				replace: true,
			});
		} else {
			// TODO
		}
	},
	
	findAndReplaceInOpenFiles() {
		if (platform.showFindDialog) {
			platform.showFindDialog({
				search: "openFiles",
				replace: true,
			});
		} else {
			// TODO
		}
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

function showFindBar() {
	showingFindBar = true;
	
	getCurrentEditor()?.blur();
}

function hideFindBar() {
	showingFindBar = false;
	
	getCurrentEditor()?.focus();
}

function focusLeftPane() {
	
}

function focusRightPane() {
	
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
	grid-template-rows: auto auto 1fr auto auto;
	grid-template-columns: auto 1fr auto;
	grid-template-areas:
		"toolbar toolbar toolbar"
		"left tabBar right"
		"left editor right"
		"left findBar right"
		"bottom bottom bottom";
	width: 100vw;
	height: 100vh;
	user-select: none;
}

#toolbar {
	grid-area: toolbar;
	border-bottom: $border;
}

#leftContainer {
	grid-area: left;
}

#left {
	width: 100%;
	height: 100%;
	border-right: $border;
}

#tabBarContainer {
	grid-area: tabBar;
}

#tabBar {
	border-bottom: $border;
}

#editor {
	display: grid;
	grid-template-rows: 1fr auto;
	grid-template-columns: 1fr;
	grid-area: editor;
}

.tab {
	display: grid;
	grid-template-rows: 1fr;
	grid-template-columns: 1fr;
}

#findBarContainer {
	grid-area: findBar;
}

#findBar {
	border-top: $border;
}

#rightContainer {
	grid-area: right;
}

#right {
	width: 100%;
	height: 100%;
	border-left: $border;
}

#bottomContainer {
	grid-area: bottom;
}

#bottom {
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
	<div id="leftContainer">
		{#if showingLeftPane}
			<div id="left">
				<LeftPane
					on:focus={focusLeftPane}
				/>
			</div>
		{/if}
	</div>
	<div id="tabBarContainer">
		<div id="tabBar">
			<TabBar
				{tabs}
				{selectedTab}
				on:select={onSelectTab}
				on:close={onCloseTab}
			/>
		</div>
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
	<div id="findBarContainer">
		{#if showingFindBar}
			<div id="findBar">
				<FindBar
					on:close={hideFindBar}
				/>
			</div>
		{/if}
	</div>
	<div id="rightContainer">
		{#if showingRightPane}
			<div id="right">
				<RightPane
					on:focus={focusRightPane}
				/>
			</div>
		{/if}
	</div>
	<div id="bottomContainer">
		{#if showingBottomPane}
			<div id="bottom">
				bottom
			</div>
		{/if}
	</div>
</div>
