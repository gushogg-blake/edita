<script>
let fs = require("flowfs");

import {createEventDispatcher} from "svelte";

let fire = createEventDispatcher();

export let tabs;
export let selectedTab;

function clickTab(tab) {
	fire("select", tab);
}

function closeTab(tab) {
	fire("close", tab);
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
	font-size: 14px;
	display: flex;
	width: 100%;
	height: 100%;
	background: #EDECEA;
}

.tabButton {
	padding: .5em 1em;
	
	&.isSelected {
		/*box-shadow: */
		background: white;
	}
}
</style>

<div id="main">
	{#each tabs as tab}
		<div
			class="tabButton"
			class:isSelected={tabIsSelected(tab, selectedTab)}
			on:click={() => clickTab(tab)}
			on:auxclick={() => closeTab(tab)}
		>
			<div class="icon">
				
			</div>
			<div class="name">
				{getTabName(tabs, tab)}
			</div>
			<div class="controls">
				<button on:click={() => closeTab(tab)}>x</button>
			</div>
		</div>
	{/each}
</div>
