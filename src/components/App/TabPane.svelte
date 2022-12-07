<script>
import {onMount, getContext} from "svelte";
import TabBar from "components/TabBar.svelte";
import ResizeHandle from "./ResizeHandle.svelte";
import FindResultsTab from "./FindResultsTab.svelte";
import RefactorTab from "./RefactorTab.svelte";
import ClippingsTab from "./ClippingsTab.svelte";

export let pane;

let {contents} = pane;
let {tabs, selectedTab} = contents;

/*
size and visibility are applied with manual dom manip so panes can adjust
according to below panes without loads of flashing (using reactivity would
mean waiting for the next tick between updates etc)
*/

let main;
let contentsDiv;

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
	contents.selectTab(tab);
}

function updateTabs() {
	({tabs} = contents);
}

function onSelectTab() {
	({selectedTab} = contents);
}

function onUpdatePane() {
	let {visible, size, paneBelowSize} = pane;
	
	inlineStyle.assign(contents, {
		height: size - paneBelowSize,
	});
	
	main.style = visible ? "" : inlineStyle({
		position: "absolute",
		left: -9000,
		top: -9000,
	});
}

onMount(function() {
	pane.uiMounted();
	
	let teardown = [
		pane.on("requestTotalSize", set => set(main.offsetHeight)),
		pane.on("update", onUpdatePane),
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
	position: relative;
	display: grid;
	grid-template-rows: auto 1fr;
	width: 100%;
	height: 100%;
	border-top: var(--appBorder);
}

#tabBar {
	--buttonPaddingY: 0;
}

#contents {
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

<div
	bind:this={main}
	id="main"
>
	<ResizeHandle
		position="top"
		getSize={() => size}
		on:resize={({detail: size}) => pane.resize(size)}
		on:end={({detail: size}) => pane.resizeAndSave(size)}
	/>
	<div id="tabBar">
		<TabBar
			{tabs}
			{selectedTab}
			{getDetails}
			on:select={select}
			on:close={({detail: tab}) => contents.closeTab(tab)}
		/>
	</div>
	<div bind:this={contentsDiv} id="contents">
		{#each tabs as tab (tab)}
			<div class="tab" class:selected={tab === selectedTab}>
				<svelte:component this={tabComponents[tab.type]} {tab}/>
			</div>
		{/each}
	</div>
</div>
