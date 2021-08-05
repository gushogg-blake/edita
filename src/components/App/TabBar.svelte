<script>
let fs = require("flowfs");

import {onMount, createEventDispatcher, getContext} from "svelte";
import Gap from "../utils/Gap.svelte";

let fire = createEventDispatcher();

let app = getContext("app");

let {
	tabs,
	selectedTab,
} = app;

function clickTab(tab) {
	app.selectTab(tab);
}

function closeTab(tab) {
	app.closeTab(tab);
}

function auxClickTab(tab, e) {
	if (e.button === 1) {
		closeTab(tab);
	}
}

function tabIsSelected(tab, selectedTab) {
	return selectedTab === tab;
}

function getTabName(tabs, tab) {
	let {document} = tab;
	let {path} = document;
	
	if (path) {
		// TODO asterisk if modified
		return fs(path).name; // TODO display name for tab (show path parts to disambiguate from other tabs)
	} else {
		return "New file";
	}
}

function onUpdateTabs() {
	tabs = app.tabs;
}

function onSelectTab() {
	selectedTab = app.selectedTab;
}

onMount(function() {
	let teardown = [
		app.on("updateTabs", onUpdateTabs),
		app.on("selectTab", onSelectTab),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style type="text/scss">
#main {
	font-size: 14px;
	display: flex;
	width: 100%;
	height: 100%;
	padding: 1px 3px 0;
	background: #EDECEA;
}

.tabButton {
	$radius: 3px;
	
	display: flex;
	align-items: center;
	border-radius: $radius $radius 0 0;
	padding: 6px 12px;
	
	&.isSelected {
		box-shadow: 0 0 3px 0 rgba(0, 0, 0, .2);
		background: white;
	}
}
</style>

<div id="main">
	{#each tabs as tab}
		<div
			class="tabButton"
			class:isSelected={tabIsSelected(tab, selectedTab)}
			on:click={() => clickTab(tab)}
			on:auxclick={(e) => auxClickTab(tab, e)}
		>
			<div class="name">
				{getTabName(tabs, tab)}
			</div>
			<Gap width={10}/>
			<div class="controls">
				<button on:click={() => closeTab(tab)}>x</button>
			</div>
		</div>
	{/each}
</div>
