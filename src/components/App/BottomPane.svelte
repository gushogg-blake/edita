<script>
import {onMount, getContext} from "svelte";
import TabBar from "components/TabBar.svelte";
import FindResults from "components/FindResults.svelte";
import Clippings from "components/Clippings.svelte";

let app = getContext("app");

let {bottomPane} = app;

let {
	tabs,
	selectedTab,
} = bottomPane;

function getDetails(tabs, tab) {
	return {
		label: tab.label,
		closeable: false,
	};
}

function select({detail: tab}) {
	bottomPane.selectTab(tab);
}

function updateTabs() {
	tabs = bottomPane.tabs;
}

function onSelectTab() {
	selectedTab = bottomPane.selectedTab;
}

onMount(function() {
	let teardown = [
		bottomPane.on("updateTabs", updateTabs),
		bottomPane.on("selectTab", onSelectTab),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
@import "classes/hide";

#main {
	display: grid;
	grid-template-rows: auto 1fr;
	width: 100%;
	height: 100%;
}

.content {
	width: 100%;
	height: 100%;
}
</style>

<div id="main">
	<div id="tabBar">
		<TabBar
			{tabs}
			{selectedTab}
			{getDetails}
			on:select={select}
		/>
	</div>
	<div id="content">
		<div class="content" class:hide={selectedTab.id !== "findResults"}>
			<FindResults/>
		</div>
		<div class="content" class:hide={selectedTab.id !== "clippings"}>
			<Clippings/>
		</div>
		<div class="content" class:hide={selectedTab.id !== "log"}>
			Log
		</div>
		<div class="content" class:hide={selectedTab.id !== "commandLine"}>
			Command line
		</div>
	</div>
</div>
