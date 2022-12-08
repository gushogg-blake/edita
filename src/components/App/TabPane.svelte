<script>
import {onMount, getContext} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import TabBar from "components/TabBar.svelte";
import ResizeHandle from "./ResizeHandle.svelte";
import FindResultsTab from "./FindResultsTab.svelte";
import RefactorTab from "./RefactorTab.svelte";
import ClippingsTab from "./ClippingsTab.svelte";

export let pane;

function _update() {
	update();
}

export {_update as update};

let {tabs, selectedTab} = pane;

/*
size and visibility are applied with manual dom manip to make logic
easier, e.g. being able to query total size immediately after setting
size

("size" for tab panes is the content size, so that 0 is the "just the
tab bar" state).
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
	pane.selectTab(tab);
}

function updateTabs() {
	({tabs} = pane);
}

function onSelectTab() {
	({selectedTab} = pane);
}

function update() {
	let {visible, size, expanded} = pane;
	
	inlineStyle.assign(contentsDiv, {
		height: expanded ? size : 0,
	});
	
	main.style = visible ? "" : inlineStyle({
		position: "absolute",
		left: -9000,
		top: -9000,
	});
}

onMount(function() {
	let teardown = [
		pane.on("requestTotalSize", set => set(main.offsetHeight)),
		pane.on("requestContentSize", set => set(contentsDiv.offsetHeight)),
		pane.on("update", update),
		pane.on("updateTabs", updateTabs),
		pane.on("selectTab", onSelectTab),
	];
	
	update();
	
	pane.uiMounted();
	
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

<div bind:this={main} id="main">
	<ResizeHandle
		position="top"
		on:resize
		on:resizeEnd
	/>
	<div id="tabBar">
		<TabBar
			{tabs}
			{selectedTab}
			{getDetails}
			on:select={select}
			on:close={({detail: tab}) => pane.closeTab(tab)}
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
