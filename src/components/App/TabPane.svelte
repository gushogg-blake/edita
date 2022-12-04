<script>
import {onMount, getContext} from "svelte";
import TabBar from "components/TabBar.svelte";
import Pane from "./Pane";
import FindResultsTab from "./FindResultsTab.svelte";
import RefactorTab from "./RefactorTab.svelte";
import ClippingsTab from "./ClippingsTab.svelte";

export let pane;

let {contents} = pane;

let {
	tabs,
	selectedTab,
} = contents;

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
	({tabs} = contents);
}

function onSelectTab() {
	({selectedTab} = contents);
}

onMount(function() {
	let teardown = [
		contents.on("updateTabs", updateTabs),
		contents.on("selectTab", onSelectTab),
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

<Pane {pane}>
	<div id="main">
		<div id="tabBar">
			<TabBar
				{tabs}
				{selectedTab}
				{getDetails}
				on:select={select}
				on:close={({detail: tab}) => contents.closeTab(tab)}
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
</Pane>
