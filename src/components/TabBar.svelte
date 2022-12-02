<script>
import {onMount, createEventDispatcher, getContext, tick} from "svelte";
import screenOffsets from "utils/dom/screenOffsets";
import scrollIntoView from "utils/dom/scrollIntoView";
import Gap from "components/utils/Gap.svelte";

export let tabs;
export let selectedTab;
export let getDetails;
export let getContextMenuItems = null;
export let reorderable = false;
export let mimeType = "application/vnd.editor.tab";

let app = getContext("app");

let fire = createEventDispatcher();

let main;
let mounted = false;
let isMounted = () => mounted;

async function mousedownTab(e, tab) {
	if (e.button !== 0) {
		return;
	}
	
	fire("select", tab);
}

function dblclickTab(e, tab) {
	fire("dblclick", tab);
}

function closeTab(tab) {
	fire("close", tab);
}

function auxclickTab(e, tab) {
	if (e.button === 1 && tab.closeable) {
		closeTab(tab);
	}
}

function showContextMenu(e, tab) {
	if (!getContextMenuItems) {
		return;
	}
	
	platform.showContextMenu(e, app, getContextMenuItems(tab));
}

function tabIsSelected(tab, selectedTab) {
	return selectedTab === tab;
}

function wheel(e) {
	e.preventDefault();
	
	main.scrollLeft += e.deltaY * 2;
}

let dropIndex = null;
let dragging = false;

function tabIndexFromMouseEvent(e) {
	let tabButtons = [...main.querySelectorAll(".tabButton")];
	let index = 0;
	
	for (let tabButton of tabButtons) {
		let offsets = screenOffsets(tabButton);
		
		if (e.clientX > offsets.x + offsets.width / 2) {
			index++;
		}
	}
	
	return index;
}

function dragstart(e) {
	e.dataTransfer.effectAllowed = "all";
	e.dataTransfer.setData(mimeType, ""); //
	e.dataTransfer.setDragImage(new Image(), 0, 0);
	
	dragging = true;
}

function dragover(e) {
	if (dragging && !reorderable || !e.dataTransfer.types.includes(mimeType)) {
		return;
	}
	
	e.preventDefault();
	
	dropIndex = tabIndexFromMouseEvent(e);
}

function drop(e) {
	e.preventDefault();
	
	fire("reorder", {
		tab: selectedTab,
		index: tabIndexFromMouseEvent(e),
	});
}

function dragend(e) {
	dropIndex = null;
	dragging = false;
}

let tabButtons = new Map();

function registerTabButton(node, tab) {
	tabButtons.set(tab, node);
	
	return function() {
		tabButtons.delete(tab);
	}
}

async function scrollSelectedTabIntoView() {
	await tick();
	
	let tabButton = tabButtons.get(selectedTab);
	
	if (!tabButton) {
		return;
	}
	
	scrollIntoView(tabButton, main);
}

$: if (isMounted() && [tabs, selectedTab]) {
	scrollSelectedTabIntoView();
}

onMount(function() {
	mounted = true;
	
	scrollSelectedTabIntoView();
});
</script>

<style lang="scss">
#main {
	white-space: nowrap;
	padding: 0px 0 0;
	overflow-x: auto;
	overflow-y: hidden;
	background: var(--appBackground);
	
	&::-webkit-scrollbar {
	    display: none;
	}
}

.tabButton {
	$radius: 3px;
	
	display: inline-flex;
	align-items: center;
	min-height: var(--tabHeight, 30px);
	border-radius: $radius $radius 0 0;
	padding: 0 12px;
	background: var(--tabBackground);
	
	&.isSelected {
		//box-shadow: 0 0 3px 0 rgba(0, 0, 0, .2);
		background: var(--tabSelectedBackground);
	}
}

#dropMarker {
	position: relative;
	display: inline-block;
	width: 0;
	height: 25px;
	vertical-align: middle;
	
	div {
		position: absolute;
		top: 0;
		left: 0;
		width: 2px;
		height: 100%;
		background: #323232;
	}
}

button {
	border: 0;
	background: transparent;
}
</style>

<div
	bind:this={main}
	id="main"
	on:wheel={wheel}
	on:dragover={dragover}
	on:drop={drop}
>
	{#each tabs as tab, i (tab)}
		{#if dropIndex === i}
			<div id="dropMarker">
				<div></div>
			</div>
		{/if}
		<div
			class="tabButton"
			class:isSelected={tabIsSelected(tab, selectedTab)}
			on:mousedown={(e) => mousedownTab(e, tab)}
			on:dblclick={(e) => dblclickTab(e, tab)}
			on:auxclick={(e) => auxclickTab(e, tab)}
			on:contextmenu={(e) => showContextMenu(e, tab)}
			draggable={reorderable}
			on:dragstart={dragstart}
			on:dragend={dragend}
			use:registerTabButton={tab}
		>
			<div class="name">
				{getDetails(tabs, tab).label}
			</div>
			{#if getDetails(tabs, tab).closeable}
				<Gap width={10}/>
				<div class="controls">
					<button on:click={() => closeTab(tab)}>x</button>
				</div>
			{/if}
		</div>
	{/each}
	{#if dropIndex === tabs.length}
		<div id="dropMarker">
			<div></div>
		</div>
	{/if}
</div>
