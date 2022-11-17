<script>
import {onMount, setContext, tick} from "svelte";

import getKeyCombo from "utils/getKeyCombo";
import inlineStyle from "utils/dom/inlineStyle";

import themeStyle from "components/themeStyle";
import labelClick from "components/actions/labelClick";

import Toolbar from "./Toolbar.svelte";
import EditorTabBar from "./EditorTabBar.svelte";
import Tab from "./Tab.svelte";
import LeftPane from "./LeftPane.svelte";
import RightPane from "./RightPane.svelte";
import BottomPane from "./BottomPane.svelte";
import ResizeHandle from "./ResizeHandle.svelte";
import FindBar from "./FindBar.svelte";
import FindAndReplace from "./FindAndReplace.svelte";

export let app;

let main;

setContext("app", app);

let {theme} = base;

let {
	tabs,
	selectedTab,
	panes,
} = app;

let showingFindBar = false;

// ENTRYPOINT global key presses (handler installed on main div below)

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (base.prefs.globalKeymap[keyCombo]) {
		e.preventDefault();
		
		app.functions[base.prefs.globalKeymap[keyCombo]]();
	}
}

function dragover(e) {
	e.preventDefault();
}

async function drop(e) {
	e.preventDefault();
	
	for (let {path, code} of await platform.filesFromDropEvent(e)) {
		app.openPath(path, code);
	}
}

function mousedown(e) {
	if (e.button === 2) {
		e.preventDefault(); // prevent right click blurring active element
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
	({panes} = app);
}

function onThemeUpdated() {
	({theme} = base);
}

function renderDiv(div) {
	main.appendChild(div);
}

let paneStyle = {};

$: paneStyle.left = {
	width: panes.left.visible ? panes.left.size : 0,
};

$: paneStyle.right = {
	width: panes.right.visible ? panes.right.size : 0,
};

$: paneStyle.bottom = {
	height: panes.bottom.visible ? panes.bottom.size : 0,
};

onMount(function() {
	let teardown = [
		base.on("themeUpdated", onThemeUpdated),
		
		app.on("updateTabs", onUpdateTabs),
		app.on("selectTab", onSelectTab),
		app.on("hideFindBar", onHideFindBar),
		app.on("showFindBar", onShowFindBar),
		app.on("updatePanes", onUpdatePanes),
		app.on("renderDiv", renderDiv),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
@import "mixins/abs-sticky";

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

#leftPaneContainer {
	position: relative;
	grid-area: left;
	min-width: 0;
}

#leftPane {
	height: 100%;
	border-right: var(--appBorder);
	overflow: hidden;
}

#tabBarContainer {
	grid-area: tabBar;
	min-width: 0;
}

#tabBar {
	border-bottom: var(--appBorder);
}

#editor {
	position: relative;
	display: grid;
	grid-template-rows: 1fr auto;
	grid-template-columns: 1fr;
	grid-area: editor;
	min-width: 0;
}

.tab {
	@include abs-sticky;
	
	z-index: -1;
	display: grid;
	grid-template-rows: 1fr;
	grid-template-columns: 1fr;
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

#rightPaneContainer {
	position: relative;
	grid-area: right;
	min-width: 0;
}

#rightPane {
	height: 100%;
	border-left: var(--appBorder);
}

#bottom {
	grid-area: bottom;
	min-width: 0;
}

#bottomPaneContainer {
	position: relative;
}

#bottomPane {
	border-top: var(--appBorder);
	height: 100%;
}
</style>

<div
	bind:this={main}
	id="main"
	class="treefrog"
	style={themeStyle(theme)}
	on:dragover={dragover}
	on:drop={drop}
	on:keydown={keydown}
	on:mousedown={mousedown}
	on:contextmenu={e => e.preventDefault()}
	tabindex="0"
	use:labelClick
>
	<div id="toolbar">
		<Toolbar/>
	</div>
	<div
		id="leftPaneContainer"
		style={inlineStyle(paneStyle.left)}
	>
		<div id="leftPane">
			<LeftPane/>
		</div>
		<ResizeHandle
			position="right"
			getSize={() => panes.left.size}
			on:resize={({detail: size}) => app.panes.left.resize(size)}
			on:end={({detail: size}) => app.panes.left.resizeAndSave(size)}
		/>
	</div>
	<div id="tabBarContainer">
		{#if tabs.length > 0}
			<div id="tabBar">
				<EditorTabBar/>
			</div>
		{/if}
	</div>
	<div id="editor">
		{#each tabs as tab (tab)}
			<div class="tab" class:selected={tab === selectedTab}>
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
	<div
		id="rightPaneContainer"
		style={inlineStyle(paneStyle.right)}
	>
		<div id="rightPane">
			<RightPane/>
		</div>
		<ResizeHandle
			position="left"
			getSize={() => panes.right.size}
			on:resize={({detail: size}) => app.panes.right.resize(size)}
			on:end={({detail: size}) => app.panes.right.resizeAndSave(size)}
		/>
	</div>
	<div id="bottom">
		<FindAndReplace/>
		<div
			id="bottomPaneContainer"
			style={inlineStyle(paneStyle.bottom)}
		>
			<div id="bottomPane">
				<BottomPane/>
			</div>
			<ResizeHandle
				position="top"
				getSize={() => panes.bottom.size}
				on:resize={({detail: size}) => app.panes.bottom.resize(size)}
				on:end={({detail: size}) => app.panes.bottom.resizeAndSave(size)}
			/>
		</div>
	</div>
</div>
