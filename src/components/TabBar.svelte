<script lang="ts">
import {onMount, tick} from "svelte";
import screenOffsets from "utils/dom/screenOffsets";
import scrollIntoView from "utils/dom/scrollIntoView";
import {getApp} from "components/context";
import Gap from "components/utils/Gap.svelte";

let {
	border = false,
	showBorder = true,
	tabs,
	selectedTab,
	getDetails,
	getContextMenuItems = null,
	reorderable = false,
	mimeType = "application/vnd.editor.tab",
	onclick = () => {},
	onselect = () => {},
	ondblclick = () => {},
	onclose = () => {},
	onreorder = () => {},
} = $props();

let app = getApp();

let main: HTMLDivElement = $state();

async function mousedownTab(e, tab) {
	if (e.button !== 0) {
		return;
	}
	
	onselect(tab);
}

function dblclickTab(e, tab) {
	ondblclick(tab);
}

function closeTab(tab) {
	onclose(tab);
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

let dropIndex = $state(null);
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
	e.stopPropagation();
	
	onreorder({
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
	
	return {
		destroy() {
			tabButtons.delete(tab);
		},
	};
}

async function scrollSelectedTabIntoView() {
	await tick();
	
	let tabButton = tabButtons.get(selectedTab);
	
	if (!tabButton) {
		return;
	}
	
	scrollIntoView(tabButton, main);
}

$effect(() => {
	let _deps = [tabs, selectedTab];
	
	scrollSelectedTabIntoView();
});

onMount(function() {
	scrollSelectedTabIntoView();
});
</script>

<style lang="scss">
#main {
	white-space: nowrap;
	position: relative;
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
	
	position: relative;
	z-index: 1;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	min-height: var(--tabHeight, 30px);
	border-radius: $radius $radius 0 0;
	padding: 0 12px;
	background: var(--tabBackground);
	
	&.border {
		gap: 5px;
	}
	
	&.border.closeable {
		padding: 0 6px 0 12px;
	}
	
	&:not(.border).isSelected {
		//box-shadow: 0 0 3px 0 rgba(0, 0, 0, .2);
		background: var(--tabSelectedBackground);
	}
	
	&.border.isSelected {
		border-bottom: var(--tabSelectedBorder);
	}
}

#border {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: var(--appBorderMediumColor);
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

span.disambiguator {
	opacity: .75;
}
</style>

<div
	bind:this={main}
	id="main"
	onwheel={wheel}
	ondragover={dragover}
	ondrop={drop}
>
	{#each tabs as tab, i (tab)}
		{@const {
			name,
			disambiguator,
			modified,
			tooltip,
			closeable,
		} = getDetails(tabs, tab)}
		
		{#if dropIndex === i}
			<div id="dropMarker">
				<div></div>
			</div>
		{/if}
		<div
			title={tooltip}
			class="tabButton"
			class:border
			class:closeable
			class:isSelected={tabIsSelected(tab, selectedTab)}
			onmousedown={(e) => mousedownTab(e, tab)}
			ondblclick={(e) => dblclickTab(e, tab)}
			onauxclick={(e) => auxclickTab(e, tab)}
			oncontextmenu={(e) => showContextMenu(e, tab)}
			draggable={reorderable}
			ondragstart={dragstart}
			ondragend={dragend}
			use:registerTabButton={tab}
		>
			<div class="name">
				{#if disambiguator}
					<span class="disambiguator">{disambiguator}</span>
				{/if}{name}
				{#if modified}
					*
				{/if}
			</div>
			{#if closeable}
				<div class="controls">
					<button onclick={() => closeTab(tab)}>x</button>
				</div>
			{/if}
		</div>
	{/each}
	{#if border && showBorder}
		<div id="border"></div>
	{/if}
	{#if dropIndex === tabs.length}
		<div id="dropMarker">
			<div></div>
		</div>
	{/if}
</div>
