<script>
import {onMount, setContext} from "svelte";

import getKeyCombo from "utils/getKeyCombo";
import inlineStyle from "utils/dom/inlineStyle";

import Toolbar from "./Toolbar.svelte";
import EditorTabBar from "./EditorTabBar.svelte";
import Tab from "./Tab.svelte";
import LeftPane from "./LeftPane.svelte";
import RightPane from "./RightPane.svelte";
import BottomPane from "./BottomPane.svelte";
import ResizeHandle from "./ResizeHandle.svelte";
import FindBar from "./FindBar.svelte";

export let app;

let main;

setContext("app", app);

let {
	tabs,
	selectedTab,
	panes,
} = app;

let showingFindBar = false;

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (platform.prefs.globalKeymap[keyCombo]) {
		e.preventDefault();
		
		app.functions[platform.prefs.globalKeymap[keyCombo]]();
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
		panes,
	} = app);
}

let paneStyle = {};

$: paneStyle.left = {
	width: panes.left.show ? panes.left.size : 0,
};

$: paneStyle.right = {
	width: panes.right.show ? panes.right.size : 0,
};

$: paneStyle.bottom = {
	height: panes.bottom.show ? panes.bottom.size : 0,
};

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

<style type="text/scss">
@import "mixins/flex-col";
@import "mixins/abs-sticky";

#main {
	--resizeHandleSize: 3px;
	
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
	background: var(--appBackgroundColor);
}

#toolbar {
	grid-area: toolbar;
	min-width: 0;
	border-bottom: var(--appBorder);
}

.pane {
	overflow: hidden;
}

#leftContainer {
	position: relative;
	grid-area: left;
	min-width: 0;
}

#left {
	height: 100%;
	border-right: var(--appBorder);
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
	
	z-index: 0;
	display: grid;
	grid-template-rows: 1fr;
	grid-template-columns: 1fr;
	background: white;
	contain: strict;
	
	&.selected {
		z-index: 1;
	}
}

#findBarContainer {
	grid-area: findBar;
	min-width: 0;
}

#findBar {
	border-top: var(--appBorder);
}

#rightContainer {
	position: relative;
	grid-area: right;
	min-width: 0;
}

#right {
	height: 100%;
	border-left: var(--appBorder);
}

#bottomContainer {
	position: relative;
	grid-area: bottom;
	min-width: 0;
}

#bottom {
	border-top: var(--appBorder);
	height: 100%;
}
</style>

<div
	bind:this={main}
	id="main"
	class="editor"
	on:dragover={dragover}
	on:drop={drop}
	on:keydown={keydown}
	tabindex="0"
>
	<div id="toolbar">
		<Toolbar/>
	</div>
	<div
		id="leftContainer"
		class="pane"
		style={inlineStyle(paneStyle.left)}
	>
		<div id="left">
			<LeftPane/>
		</div>
		<ResizeHandle
			position="left"
			getSize={() => panes.left.size}
			on:resize={({detail: size}) => app.resizePane("left", size)}
			on:end={({detail: size}) => app.resizePaneAndSave("left", size)}
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
		id="rightContainer"
		class="pane"
		style={inlineStyle(paneStyle.right)}
	>
		<div id="right">
			<RightPane/>
		</div>
		<ResizeHandle
			position="right"
			getSize={() => panes.right.size}
			on:resize={({detail: size}) => app.resizePane("right", size)}
			on:end={({detail: size}) => app.resizePaneAndSave("right", size)}
		/>
	</div>
	<div
		id="bottomContainer"
		class="pane"
		style={inlineStyle(paneStyle.bottom)}
	>
		<div id="bottom">
			<BottomPane/>
		</div>
		<ResizeHandle
			position="bottom"
			getSize={() => panes.bottom.size}
			on:resize={({detail: size}) => app.resizePane("bottom", size)}
			on:end={({detail: size}) => app.resizePaneAndSave("bottom", size)}
		/>
	</div>
</div>
