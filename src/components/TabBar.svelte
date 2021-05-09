<script>
let fs = require("flowfs");

import {createEventDispatcher} from "svelte";
import Gap from "./Gap.svelte";

let fire = createEventDispatcher();

export let tabs;
export let selectedTab;

function clickTab(tab) {
	fire("select", tab);
}

function closeTab(tab) {
	fire("close", tab);
}

function auxClickTab(tab, e) {
	if (e.button === 1) {
		closeTab(tab);
	}
}

function tabIsSelected(tab, selectedTab) {
	return selectedTab === tab;
}

function getTabName(tabs, tab) {
	// TODO asterisk if modified
	return fs(tab.path).name; // TODO display name for tab (show path parts to disambiguate from other tabs)
}
</script>

<style type="text/scss">
#main {
	font-size: 14px;
	display: flex;
	width: 100%;
	height: 100%;
	padding: 1px 3px 0;
	background: #EDECEA;
}

.tabButton {
	$radius: 3px;
	
	display: flex;
	align-items: center;
	border-radius: $radius $radius 0 0;
	padding: .5em 1em;
	
	&.isSelected {
		box-shadow: 0 0 3px 0 rgba(0, 0, 0, .2);
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
			on:auxclick={(e) => auxClickTab(tab, e)}
		>
			<div class="name">
				{getTabName(tabs, tab)}
			</div>
			<Gap width={10}/>
			<div class="controls">
				<button on:click={() => closeTab(tab)}>x</button>
			</div>
		</div>
	{/each}
</div>
