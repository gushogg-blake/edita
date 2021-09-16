<script>
import {onMount, createEventDispatcher, getContext} from "svelte";
import screenOffsets from "utils/dom/screenOffsets";
import Gap from "components/utils/Gap.svelte";

let fire = createEventDispatcher();

let app = getContext("app");

let mimeType = "application/vnd.editor.tab";

let main;

let {
	tabs,
	selectedTab,
} = app;

function mousedownTab(e, tab) {
	if (e.button !== 0) {
		return;
	}
	
	app.selectTab(tab);
}

function closeTab(tab) {
	app.closeTab(tab);
}

function auxclickTab(e, tab) {
	if (e.button === 1) {
		closeTab(tab);
	}
}

function showContextMenu(e, tab) {
	let {path} = tab.editor.document;
	
	let items = [
		path && {
			label: "&Rename...",
			
			onClick() {
				app.renameTab(tab);
			},
		},
		
		path && {
			label: "&Delete...",
			
			onClick() {
				app.deleteTab(tab);
			},
		},
	];
	
	platform.showContextMenu(e, items);
}

function tabIsSelected(tab, selectedTab) {
	return selectedTab === tab;
}

function updateTabs() {
	tabs = app.tabs;
}

function getTabLabel(tabs, tab) {
	return app.getTabLabel(tab);
}

function onSelectTab() {
	selectedTab = app.selectedTab;
}

function wheel(e) {
	main.scrollLeft += e.deltaY;
}

let dropIndex = null;

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
}

function dragover(e) {
	if (!e.dataTransfer.types.includes(mimeType)) {
		return;
	}
	
	e.preventDefault();
	
	dropIndex = tabIndexFromMouseEvent(e);
}

function drop(e) {
	e.preventDefault();
	
	app.reorderTab(selectedTab, tabIndexFromMouseEvent(e));
}

function dragend(e) {
	dropIndex = null;
}

onMount(function() {
	let teardown = [
		app.on("updateTabs", updateTabs),
		app.on("selectTab", onSelectTab),
		app.on("document.save", updateTabs),
		app.on("document.edit", updateTabs),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
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
				{getTabLabel(tabs, tab)}
			</div>
			<Gap width={10}/>
			<div class="controls">
				<button on:click={() => closeTab(tab)}>x</button>
			</div>
		</div>
	{/each}
	{#if dropIndex === tabs.length}
		<div id="dropMarker">
			<div></div>
		</div>
	{/if}
</div>
