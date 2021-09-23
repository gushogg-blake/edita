<script>
import {createEventDispatcher} from "svelte";
import screenOffsets from "utils/dom/screenOffsets";
import Gap from "components/utils/Gap.svelte";

export let tabs;
export let selectedTab;
export let getDetails;
export let getContextMenuItems = null;
export let reorderable = false;
export let mimeType = "application/vnd.editor.tab";

$: console.log(selectedTab);

let fire = createEventDispatcher();

let main;

function mousedownTab(e, tab) {
	if (e.button !== 0) {
		return;
	}
	
	fire("select", tab);
}

function closeTab(tab) {
	fire("close", tab);
}

function auxclickTab(e, tab) {
	if (e.button === 1) {
		closeTab(tab);
	}
}

function showContextMenu(e, tab) {
	if (!getContextMenuItems) {
		return;
	}
	
	platform.showContextMenu(e, getContextMenuItems(tab));
}

function tabIsSelected(tab, selectedTab) {
	return selectedTab === tab;
}

function wheel(e) {
	main.scrollLeft += e.deltaY;
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
</script>

<style type="text/scss">
#main {
	white-space: nowrap;
	padding: 1px 3px 0;
	overflow-x: auto;
	overflow-y: hidden;
	background: var(--appBackgroundColor);
	
	&::-webkit-scrollbar {
	    display: none;
	}
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
	color: #333333;
	border: 0;
	border-radius: 3px;
	padding: .3em .7em;
	outline: none;
	
	&:active {
		box-shadow: inset 1px 1px 3px #00000025;
	}
}
</style>

<div
	bind:this={main}
	id="main"
	on:wheel={wheel}
	on:dragover={dragover}
	on:drop={drop}
>
	{#each tabs as tab, i}
		{#if dropIndex === i}
			<div id="dropMarker">
				<div></div>
			</div>
		{/if}
		<div
			class="tabButton"
			class:isSelected={tabIsSelected(tab, selectedTab)}
			on:mousedown={(e) => mousedownTab(e, tab)}
			on:auxclick={(e) => auxclickTab(e, tab)}
			on:contextmenu={(e) => showContextMenu(e, tab)}
			draggable="true"
			on:dragstart={dragstart}
			on:dragend={dragend}
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
