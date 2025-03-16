<script lang="ts">
import {onMount, getContext, tick} from "svelte";
import TabBar from "components/TabBar.svelte";

let app = getContext("app");

let tabs = $state(app.tabs);
let selectedTab = $state(app.selectedTab);

function getDetails(tabs, tab) {
	return tab;
}

function select(tab) {
	app.selectTab(tab);
}

function dblclick(tab) {
	if (tab.project) {
		app.projects.select(tab.project);
	}
}

function close(tab) {
	app.closeTab(tab);
}

function reorder({tab, index}) {
	app.reorderTab(tab, index);
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
					app.renameTab(tab);
				},
			},
			
			{
				label: "%Delete...",
				enabled: isSaved,
				
				onClick() {
					app.deleteTab(tab);
				},
			},
			
			{
				type: "separator",
			},
			
			{
				label: "Close others",
				enabled: app.tabs.length > 1,
				
				onClick() {
					app.closeOthers(tab);
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
	tabs = app.tabs;
}

async function onSelectTab() {
	selectedTab = app.selectedTab;
}

onMount(function() {
	let teardown = [
		app.on("updateTabs", updateTabs),
		app.on("selectTab", onSelectTab),
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
