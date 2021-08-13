<script>
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
	let {editor} = tab;
	let {path, modified} = editor.document;
	
	if (path) {
		return platform.fs(path).name + (modified ? " *" : "");
	} else {
		return "New file" + (modified ? " *" : "");
	}
}

function updateTabs() {
	tabs = app.tabs;
}

function onSelectTab() {
	selectedTab = app.selectedTab;
}

onMount(function() {
	let teardown = [
		app.on("updateTabs", updateTabs),
		app.on("selectTab", onSelectTab),
		app.on("document.save", updateTabs),
		app.on("document.edit", updateTabs),
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
	white-space: nowrap;
	padding: 1px 3px 0;
	overflow-x: auto;
	background: var(--appBackgroundColor);
}

.tabButton {
	$radius: 3px;
	
	display: inline-flex;
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
