<script>
import {onMount, setContext} from "svelte";

import getKeyCombo from "utils/getKeyCombo";

import Toolbar from "./Toolbar.svelte";
import TabBar from "./TabBar.svelte";
import Tab from "./Tab.svelte";
import LeftPane from "./LeftPane.svelte";
import RightPane from "./RightPane.svelte";
import BottomPane from "./BottomPane.svelte";
import FindBar from "./FindBar.svelte";

export let app;

let main;

setContext("app", app);

let {
	tabs,
	selectedTab,
	showingPane,
} = app;

let showingFindBar = false;

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (platform.prefs.globalKeymap[keyCombo]) {
		app[platform.prefs.globalKeymap[keyCombo]]();
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

function onUpdatePanes() {
	({
		showingPane,
	} = app);
}

onMount(function() {
	let teardown = [
		app.on("updateTabs", onUpdateTabs),
		app.on("selectTab", onSelectTab),
		app.on("hideFindBar", onHideFindBar),
		app.on("showFindBar", onShowFindBar),
		app.on("updatePanes", onUpdatePanes),
	];
	
	app.uiMounted(main);
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<svelte:window on:keydown={keydown}/>

<style type="text/scss">
@import "mixins/flex-col";
@import "classes/hide";

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
	min-width: 0;
	border-bottom: $border;
}

#leftContainer {
	grid-area: left;
	min-width: 0;
}

#left {
	width: 100%;
	height: 100%;
	border-right: $border;
}

#tabBarContainer {
	grid-area: tabBar;
	min-width: 0;
}

#tabBar {
	border-bottom: $border;
}

#editor {
	display: grid;
	grid-template-rows: 1fr auto;
	grid-template-columns: 1fr;
	grid-area: editor;
	min-width: 0;
}

.tab {
	display: grid;
	grid-template-rows: 1fr;
	grid-template-columns: 1fr;
}

#findBarContainer {
	grid-area: findBar;
	min-width: 0;
}

#findBar {
	border-top: $border;
}

#rightContainer {
	grid-area: right;
	min-width: 0;
}

#right {
	width: 100%;
	height: 100%;
	border-left: $border;
}

#bottomContainer {
	grid-area: bottom;
	min-width: 0;
}

#bottom {
	border-top: $border;
}
</style>

<div bind:this={main} id="main" class="editor">
	<div id="toolbar">
		<Toolbar/>
	</div>
	<div id="leftContainer">
		{#if showingPane.left}
			<div id="left">
				<LeftPane/>
			</div>
		{/if}
	</div>
	<div id="tabBarContainer">
		{#if tabs.length > 0}
			<div id="tabBar">
				<TabBar/>
			</div>
		{/if}
	</div>
	<div id="editor">
		{#each tabs as tab (tab)}
			<div class="tab" class:hide={tab !== selectedTab}>
				<Tab {tab}/>
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
		{#if showingPane.right}
			<div id="right">
				<RightPane/>
			</div>
		{/if}
	</div>
	<div id="bottomContainer">
		{#if showingPane.bottom}
			<div id="bottom">
				<BottomPane/>
			</div>
		{/if}
	</div>
</div>
