<script lang="ts">
import {onMount, getContext} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import TabBar from "components/TabBar.svelte";
import ResizeHandle from "./ResizeHandle.svelte";
import FindAndReplaceTab from "./FindAndReplaceTab.svelte";
import FindResultsTab from "./FindResultsTab.svelte";
import RefactorTab from "./RefactorTab.svelte";
import ClippingsTab from "./ClippingsTab.svelte";

let {
	pane,
	onresize = () => {},
	onresizeEnd = () => {},
} = $props();

let app = getContext("app");

let {bottomPanes} = app;

let tabs = $state(pane.tabs);
let selectedTab = $state(pane.selectedTab);

let size = $state(pane.state.size);
let visible = $state(pane.state.visible);
let expanded = $state(pane.state.expanded);

let tabComponents = {
	findAndReplace: FindAndReplaceTab,
	findResults: FindResultsTab,
	clippings: ClippingsTab,
	refactor: RefactorTab,
};

function getDetails(tabs, tab) {
	return tab;
}

function select(tab) {
	pane.selectTab(tab);
}

function updateTabs() {
	({tabs} = pane);
}

function onSelectTab() {
	({selectedTab} = pane);
}

let mainStyle = $state();
let contentsStyle = $state();

function update() {
	({size, visible, expanded} = pane.state);
	
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
		bottomPanes.on("update", update),
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
@use "utils";

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
			@include utils.abs-sticky;
			
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
			{onresize}
			{onresizeEnd}
		/>
	{/if}
	<div id="tabBar">
		<TabBar
			border
			showBorder={expanded}
			{tabs}
			{selectedTab}
			{getDetails}
			onselect={select}
			onclose={(tab) => pane.closeTab(tab)}
		/>
	</div>
	<div
		id="contents"
		class:hide={!expanded}
		class:autoSize={size === "auto"}
		style={inlineStyle(contentsStyle)}
	>
		{#each tabs as tab (tab)}
			{@const SvelteComponent = tabComponents[tab.type]}
			<div
				class="tab"
				class:hide={tab !== selectedTab}
			>
				<SvelteComponent {tab}/>
			</div>
		{/each}
	</div>
</div>
