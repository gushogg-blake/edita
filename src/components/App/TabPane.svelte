<script>
import {onMount, getContext} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import TabBar from "components/TabBar.svelte";
import ResizeHandle from "./ResizeHandle.svelte";
import FindAndReplaceTab from "./FindAndReplaceTab.svelte";
import FindResultsTab from "./FindResultsTab.svelte";
import RefactorTab from "./RefactorTab.svelte";
import ClippingsTab from "./ClippingsTab.svelte";

export let pane;
export let state;

function _update() {
	update();
}

export {_update as update};

let {tabs, selectedTab} = pane;
let {size, visible, expanded} = state;

let tabComponents = {
	findAndReplace: FindAndReplaceTab,
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
	pane.selectTab(tab);
}

function updateTabs() {
	({tabs} = pane);
}

function onSelectTab() {
	({selectedTab} = pane);
}

let mainStyle;
let contentsStyle;

function update() {
	({size, visible, expanded} = state);
	
	let height;
	
	if (size === "auto" || size === "fill") {
		height = "auto";
	} else {
		height = size;
	}
	
	contentsStyle = {
		height,
	};
	
	mainStyle = {
		flexGrow: size === "fill" ? 1 : 0,
	};
}

update();

onMount(function() {
	let teardown = [
		pane.on("updateTabs", updateTabs),
		pane.on("selectTab", onSelectTab),
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
	flex-shrink: 0;
	border-top: var(--appBorder);
}

#tabBar {
	--buttonPaddingY: 0;
}

#contents {
	position: relative;
	
	&:not(.autoSize) {
		.tab {
			@include abs-sticky;
			
			contain: strict;
		}
	}
}

.tab {
	background: var(--appBackground);
}
</style>

<div
	id="main"
	class:hide={!visible}
	style={inlineStyle(mainStyle)}
>
	{#if expanded}
		<ResizeHandle
			position="top"
			on:resize
			on:resizeEnd
		/>
	{/if}
	<div id="tabBar">
		<TabBar
			border
			showBorder={expanded}
			{tabs}
			{selectedTab}
			{getDetails}
			on:select={select}
			on:close={({detail: tab}) => pane.closeTab(tab)}
		/>
	</div>
	<div
		id="contents"
		class:hide={!expanded}
		class:autoSize={size === "auto"}
		style={inlineStyle(contentsStyle)}
	>
		{#each tabs as tab (tab)}
			<div
				class="tab"
				class:hide={tab !== selectedTab}
			>
				<svelte:component this={tabComponents[tab.type]} {tab}/>
			</div>
		{/each}
	</div>
</div>
