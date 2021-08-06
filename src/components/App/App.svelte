<script>
import {onMount, setContext} from "svelte";

import getKeyCombo from "../../utils/getKeyCombo";

import Editor from "../Editor/Editor.svelte";

import Toolbar from "./Toolbar.svelte";
import TabBar from "./TabBar.svelte";
import LeftPane from "./LeftPane.svelte";
import RightPane from "./RightPane.svelte";
import BottomPane from "./BottomPane.svelte";
import FindBar from "./FindBar.svelte";

export let app;

setContext("app", app);

let {
	tabs,
	selectedTab,
} = app;

let showingLeftPane = true;
let showingRightPane = true;
let showingBottomPane = true;
let showingFindBar = false;

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (base.prefs.globalKeymap[keyCombo]) {
		app[base.prefs.globalKeymap[keyCombo]]();
	}
}

function onUpdateTabs() {
	tabs = app.tabs;
}

function onSelectTab() {
	selectedTab = app.selectedTab;
}

function onShowFindBar() {
	showingFindBar = true;
}

function onHideFindBar() {
	showingFindBar = false;
}

onMount(async function() {
	let teardown = [
		app.on("updateTabs", onUpdateTabs),
		app.on("selectTab", onSelectTab),
		app.on("hideFindBar", onHideFindBar),
		app.on("showFindBar", onShowFindBar),
	];
	
	app.uiMounted();
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
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
	width: 100%;
	height: 100%;
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

<div id="main" class="editor">
	<div id="toolbar">
		<Toolbar/>
	</div>
	<div id="leftContainer">
		{#if showingLeftPane}
			<div id="left">
				<LeftPane/>
			</div>
		{/if}
	</div>
	<div id="tabBarContainer">
		<div id="tabBar">
			<TabBar/>
		</div>
	</div>
	<div id="editor">
		{#each tabs as tab (tab)}
			<div class="tab" class:hide={tab !== selectedTab}>
				<Editor {tab}/>
			</div>
		{/each}
	</div>
	<div id="findBarContainer">
		{#if showingFindBar}
			<div id="findBar">
				<FindBar/>
			</div>
		{/if}
	</div>
	<div id="rightContainer">
		{#if showingRightPane}
			<div id="right">
				<RightPane/>
			</div>
		{/if}
	</div>
	<div id="bottomContainer">
		{#if showingBottomPane}
			<div id="bottom">
				<BottomPane/>
			</div>
		{/if}
	</div>
</div>
