<script>
import {onMount, getContext} from "svelte";
import TabBar from "components/TabBar.svelte";
import FocusablePane from "../FocusablePane.svelte";

let app = getContext("app");

let {bottomPane} = app;

let {
	tabs,
	selectedTab,
} = bottomPane;

function getDetails(tabs, tab) {
	return {
		label: tab.label,
		closeable: false,
	};
}

function select({detail: tab}) {
	bottomPane.selectTab(tab);
}

function updateTabs() {
	tabs = app.tabs;
}

function onSelectTab() {
	selectedTab = app.selectedTab;
}

onMount(function() {
	let teardown = [
		bottomPane.on("updateTabs", updateTabs),
		bottomPane.on("selectTab", onSelectTab),
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
	display: grid;
	grid-template-rows: auto 1fr;
	width: 100%;
	height: 100%;
}

#content {
	border-top: var(--appBorder);
	background: white;
}
</style>

<FocusablePane>
	<div id="main">
		<div id="tabBar">
			<TabBar
				{tabs}
				{selectedTab}
				{getDetails}
				on:select={select}
			/>
		</div>
		<div id="content">
			asd
		</div>
	</div>
</FocusablePane>
