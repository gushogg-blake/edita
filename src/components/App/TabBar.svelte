<script lang="ts">
import {onMount, getContext, tick} from "svelte";
import TabBar from "components/TabBar.svelte";

let app = getContext("app");

let {mainTabs} = app;

let tabs = $state(mainTabs.tabs);
let selectedTab = $state(mainTabs.selectedTab);

function getDetails(tabs, tab) {
	return tab;
}

function select(tab) {
	mainTabs.selectTab(tab);
}

function dblclick(tab) {
	if (tab.project) {
		app.projects.select(tab.project);
	}
}

function close(tab) {
	mainTabs.closeTab(tab);
}

function reorder({tab, index}) {
	mainTabs.reorderTab(tab, index);
}

let _getContextMenuItems = {
	editor(tab) {
		let {isSaved} = tab.editor.document;
		
		return [
			{
				label: "%Find references",
				enabled: isSaved,
				
				onClick() {
					app.findReferencesToFile(tab);
				},
			},
			
			{
				type: "separator",
			},
			
			{
				label: "%Rename...",
				enabled: isSaved,
				
				onClick() {
					mainTabs.renameTab(tab);
				},
			},
			
			{
				label: "%Delete...",
				enabled: isSaved,
				
				onClick() {
					mainTabs.deleteTab(tab);
				},
			},
			
			{
				type: "separator",
			},
			
			{
				label: "Close others",
				enabled: mainTabs.tabs.length > 1,
				
				onClick() {
					mainTabs.closeOthers(tab);
				},
			},
		].filter(Boolean);
	},
	
	refactor(tab) {
		return [];
	},
};

function getContextMenuItems(tab) {
	return _getContextMenuItems[tab.type](tab);
}

function updateTabs() {
	tabs = mainTabs.tabs;
}

async function onSelectTab() {
	selectedTab = mainTabs.selectedTab;
}

onMount(function() {
	let teardown = [
		mainTabs.on("update", updateTabs),
		mainTabs.on("select", onSelectTab),
		
		app.on("document.save", updateTabs),
		app.on("document.edit", updateTabs),
		app.on("document.fileChanged", updateTabs),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<TabBar
	{tabs}
	{selectedTab}
	{getDetails}
	{getContextMenuItems}
	reorderable
	onselect={select}
	onclose={close}
	onreorder={reorder}
	ondblclick={dblclick}
/>
