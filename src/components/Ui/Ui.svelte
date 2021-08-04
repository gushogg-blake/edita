<script>
import {onMount, tick} from "svelte";

import getKeyCombo from "../../utils/getKeyCombo";
import {push, remove} from "../../utils/arrayMethods";

import Document from "../../modules/Document";
import Editor from "../../modules/Editor/Editor";
import View from "../../modules/View/View";

import EditorComponent from "../Editor/Editor.svelte";

import Toolbar from "./Toolbar.svelte";
import TabBar from "./TabBar.svelte";
import LeftPane from "./LeftPane.svelte";
import RightPane from "./RightPane.svelte";
import FindBar from "./FindBar.svelte";

let tabs = [];
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
		
		if (selectedTab.path) {
			//await platform.save(path, document.toString());
		} else {
			// TODO save dialog
		}
	},
	
	undo() {
		if (!selectedTab) {
			return;
		}
		
		selectedTab.editor.undo();
	},
	
	redo() {
		if (!selectedTab) {
			return;
		}
		
		selectedTab.editor.redo();
	},
	
	find() {
		if (!selectedTab) {
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

function openFile(path, code) {
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
	
	let document = new Document(code, fileDetails);
	let view = new View(document);
	let editor = new Editor(document, view);
	
	let newTab = {
		path,
		document,
		editor,
		view,
	};
	
	tabs = push(tabs, newTab);
	
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
	// TODO just selectedTab.view.hide?
	for (let otherTab of tabs.filter(t => t !== tab)) {
		otherTab.view.hide();
	}
	
	selectedTab = tab;
	
	tab.view.show();
	tab.view.focus();
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
	
	tab.view.teardown();
	
	tabs = remove(tabs, tab);
	
	if (selectNext) {
		selectTab(selectNext);
	}
}

function showFindBar() {
	showingFindBar = true;
}

function hideFindBarAndFocusEditor() {
	hideFindBar();
	
	if (selectedTab) {
		selectedTab.view.requestFocus();
	}
}

function hideFindBar() {
	showingFindBar = false;
}

onMount(async function() {
	openFile("test/repos/test.js", await require("flowfs")("test/repos/test.js").read());
});
</script>

<svelte:window on:keydown={keydown}/>

<style type="text/scss">
@import "../../css/mixins/flex-col";
@import "../../css/classes/hide";

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
	background: white;
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
				<EditorComponent
					document={tab.document}
					editor={tab.editor}
					view={tab.view}
				/>
			</div>
		{/each}
	</div>
	<div id="findBarContainer">
		{#if showingFindBar}
			<div id="findBar">
				<FindBar
					on:close={hideFindBarAndFocusEditor}
					on:blur={hideFindBar}
					editor={selectedTab?.editor}
				/>
			</div>
		{/if}
	</div>
	<div id="rightContainer">
		{#if showingRightPane}
			<div id="right">
				<RightPane
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
