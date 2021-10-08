<script>
import {onMount, getContext, tick} from "svelte";
import TabBar from "components/TabBar.svelte";

let app = getContext("app");

let {
	tabs,
	selectedTab,
} = app;

function getDetails(tabs, tab) {
	return {
		label: app.getTabLabel(tab),
		closeable: true,
	};
}

function select({detail: tab}) {
	app.selectTab(tab);
}

function close({detail: tab}) {
	app.closeTab(tab);
}

function reorder({detail: {tab, index}}) {
	app.reorderTab(tab, index);
}

function getContextMenuItems(tab) {
	let {path} = tab.editor.document;
	
	return [
		path && {
			label: "%Rename...",
			
			onClick() {
				app.renameTab(tab);
			},
		},
		
		path && {
			label: "%Delete...",
			
			onClick() {
				app.deleteTab(tab);
			},
		},
	].filter(Boolean);
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
	on:select={select}
	on:close={close}
	on:reorder={reorder}
/>
