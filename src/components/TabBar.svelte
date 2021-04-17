<script>
let fs = require("flowfs");

import {createEventDispatcher} from "svelte";

let fire = createEventDispatcher();

export let tabs;
export let selectedTab;

function clickTab(tab) {
	fire("select", tab);
}

function tabIsSelected(tab, selectedTab) {
	return selectedTab === tab;
}

function getTabName(tabs, tab) {
	return fs(tab.path).name; // TODO display name for tab (show path parts to disambiguate from other tabs)
}
</script>

<style type="text/scss">
#main {
	display: flex;
	width: 100%;
	height: 100%;
	
}

.tabButton {
	padding: .5em 1em;
}
</style>

<div id="main">
	{#each tabs as tab}
		<div class="tabButton" on:click={clickTab(tab)}>
			{getTabName(tabs, tab)}
		</div>
	{/each}
</div>
