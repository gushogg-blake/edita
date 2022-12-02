<script>
import {onMount, getContext} from "svelte";
import TabBar from "components/TabBar.svelte";
import FindResultsTab from "./FindResultsTab.svelte";
import RefactorTab from "./RefactorTab.svelte";
import ClippingsTab from "./ClippingsTab.svelte";

let app = getContext("app");

let {tools} = app;

let {
	tabs,
	selectedTab,
} = tools;

let tabComponents = {
	findResults: FindResultsTab,
	clippings: ClippingsTab,
	refactor: RefactorTab,
};

function getDetails(tabs, tab) {
	return {
		label: tab.name,
		closeable: tab.closeable,
	};
}

function select({detail: tab}) {
	tools.selectTab(tab);
}

function updateTabs() {
	tabs = tools.tabs;
}

function onSelectTab() {
	selectedTab = tools.selectedTab;
}

onMount(function() {
	let teardown = [
		tools.on("updateTabs", updateTabs),
		tools.on("selectTab", onSelectTab),
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
@import "mixins/abs-sticky";

#main {
	display: grid;
	grid-template-rows: auto 1fr;
	width: 100%;
	height: 100%;
}

#tabBar {
	--buttonPaddingY: 0;
}

#content {
	position: relative;
}

.tab {
	@include abs-sticky;
	
	z-index: -1;
	background: var(--appBackground);
	contain: strict;
	
	&.selected {
		z-index: auto;
	}
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
		{#each tabs as tab (tab)}
			<div class="tab" class:selected={tab === selectedTab}>
				<svelte:component this={tabComponents[tab.type]} {tab}/>
			</div>
		{/each}
	</div>
</div>
