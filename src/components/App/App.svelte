<script lang="ts">
import {onMount, tick} from "svelte";

import getKeyCombo from "utils/getKeyCombo";
import inlineStyle from "utils/dom/inlineStyle";

import type {App} from "ui/app";

import themeStyle from "components/utils/themeStyle";
import themeStyleDev from "components/utils/themeStyleDev";
import labelClick from "components/actions/labelClick";
import {setApp} from "components/context";

import FastOpen from "components/quickActions/FastOpen.svelte";
import CommandPalette from "components/quickActions/CommandPalette.svelte";

import FindBar from "components/FindBar.svelte";

import Toolbar from "./Toolbar.svelte";

import TabBar from "./TabBar.svelte";
import EditorTab from "./tabs/EditorTab.svelte";
import RefactorPreviewTab from "./tabs/RefactorPreviewTab.svelte";

import Pane from "./panes/Pane.svelte";
import LeftPane from "./panes/LeftPane.svelte";
import RightPane from "./panes/RightPane.svelte";
import BottomPanes from "./panes/BottomPanes.svelte";

import DevToolbar from "./DevToolbar/DevToolbar.svelte";

interface Props {
	app: App;
}

let {
	app,
}: Props = $props();

setApp(app);

let {mainTabs, panes} = app;

let main = $state<HTMLDivElement>();

let prefs = $state(base.prefs);
let theme = $state(base.theme);

let tabs = $state(mainTabs.tabs);
let selectedTab = $state(mainTabs.selectedTab);

let showingQuickAction = $state(null);

let quickActionComponents = {
	fastOpen: FastOpen,
	commandPalette: CommandPalette,
};

let tabComponents = {
	"file:": EditorTab,
	"new:": EditorTab,
	"refactor-preview:": RefactorPreviewTab,
};

let showingFindBar = $state(false);

// ENTRYPOINT global key presses (handler installed on main div below)

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	let command = base.prefs.globalKeymap[keyCombo];
	
	if (command) {
		e.preventDefault();
		
		app.commands[command]();
	}
}

function dragover(e) {
	e.preventDefault();
}

async function drop(e) {
	e.preventDefault();
	
	for (let file of await platform.filesFromDropEvent(e, app)) {
		app.fileOperations.openFile(file);
	}
}

function mousedown(e) {
	if (e.button === 2) {
		e.preventDefault(); // prevent right click blurring active element
	}
}

function onUpdateTabs() {
	tabs = mainTabs.tabs;
}

function onSelectTab() {
	selectedTab = mainTabs.selectedTab;
}

function onShowFindBar() {
	showingFindBar = true;
}

function onHideFindBar() {
	showingFindBar = false;
}

function onPrefsUpdated() {
	({prefs} = base);
}

function onThemeUpdated() {
	({theme} = base);
}

function renderDiv(div) {
	main.appendChild(div);
}

function focus() {
	main.focus();
}

onMount(function() {
	let teardown = [
		base.on("prefsUpdated", onPrefsUpdated),
		base.on("themeUpdated", onThemeUpdated),
		
		mainTabs.on("update", onUpdateTabs),
		mainTabs.on("select", onSelectTab),
		
		app.on("hideFindBar", onHideFindBar),
		app.on("showFindBar", onShowFindBar),
		app.on("renderDiv", renderDiv),
		app.on("requestFocus", focus),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<svelte:window onresize={() => app.resize()}/>

<style lang="scss">
@use "utils";

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
	outline: none;
	cursor: default;
	background: var(--appBackground);
}

#toolbar {
	grid-area: toolbar;
	min-width: 0;
	border-bottom: var(--appBorder);
}

#leftPane {
	grid-area: left;
	min-width: 0;
	height: 100%;
	overflow: hidden;
}

#tabBarContainer {
	grid-area: tabBar;
	min-width: 0;
}

#tabBar {
	--tabHeight: 35px;
	
	//border-bottom: var(--appBorderLight);
}

#editor {
	position: relative;
	grid-area: editor;
	min-width: 0;
}

.tab {
	@include utils.abs-sticky;
	
	z-index: -1;
	background: var(--appBackground);
	contain: strict;
	
	&.selected {
		z-index: auto;
	}
}

#findBarContainer {
	grid-area: findBar;
	min-width: 0;
}

#findBar {
	border-top: var(--appBorder);
}

#rightPane {
	grid-area: right;
	min-width: 0;
	height: 100%;
}

#bottom {
	grid-area: bottom;
}

#devToolbar {
	border-top: var(--appBorder);
}

#quickAction {
	position: absolute;
	top: 50px; // SYNC should be just below the tabs
	left: 0;
	right: 0;
}
</style>

<div
	bind:this={main}
	id="main"
	class="edita"
	style={themeStyle(theme.app)}
	ondragover={dragover}
	ondrop={drop}
	onkeydown={keydown}
	onmousedown={mousedown}
	oncontextmenu={e => e.preventDefault()}
	tabindex="0"
	use:labelClick
>
	{#if showingQuickAction}
		{@const Component = quickActionComponents[showingQuickAction]}
		<div id="quickAction">
			<Component/>
		</div>
	{/if}
	{#if prefs.dev.showThemeStyleElement}
		<div class="hide" use:themeStyleDev={{app, update: theme => base.modifyThemeForDev(theme)}}></div>
	{/if}
	<div id="toolbar">
		<Toolbar/>
	</div>
	<div id="leftPane">
		<Pane pane={panes.left}>
			<LeftPane/>
		</Pane>
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
			{@const Component = tabComponents[tab.protocol]}
			<div class="tab" class:selected={tab === selectedTab}>
				<Component {tab}/>
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
	<div id="rightPane">
		<Pane pane={panes.right}>
			<RightPane/>
		</Pane>
	</div>
	<div id="bottom">
		<BottomPanes/>
		{#if prefs.dev.showToolbar}
			<div id="devToolbar">
				<DevToolbar/>
			</div>
		{/if}
	</div>
</div>
