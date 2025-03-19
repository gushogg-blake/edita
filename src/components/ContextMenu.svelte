<script lang="ts">
let {
	items,
	onclick = () => {},
} = $props();

let selectedItem = $state.raw(null);

function click(item) {
	onclick(item);
}

function select(item) {
	selectedItem = item;
}

function keydown(e) {
	e.preventDefault();
	
	if (e.key === "Escape" && !options.noCancel) {
		close();
		
		return;
	}
	
	if (e.key === "Enter" && selectedItem) {
		click(selectedItem);
		
		return;
	}
	
	let key = e.key.toLowerCase();
	
	// look for a matching accelerator first
	
	for (let item of items.filter(item => item.label)) {
		let label = item.label.toLowerCase();
		
		if (label.includes("%" + key)) {
			click(item);
			
			return;
		}
	}
	
	// then look for labels that start with this char
	// inspired by how it works on Mate:
	// if there's a single match, click it, otherwise
	// cycle through the matches and accept with Enter
	
	let matchingLabels = items.filter(item => item.label?.toLowerCase().startsWith(key));
	
	if (matchingLabels.length > 0) {
		if (matchingLabels.length === 1) {
			click(matchingLabels[0]);
			
			return;
		}
		
		let selectedIndex = matchingLabels.indexOf(selectedItem);
		
		if (selectedIndex === -1 || selectedIndex === matchingLabels.at(-1)) {
			select(matchingLabels[0]);
		} else {
			select(matchingLabels[selectedIndex + 1]);
		}
	}
}
</script>

<svelte:window onkeydown={keydown}/>

<style lang="scss">
#main {
	border: var(--contextMenuBorder);
	padding: 3px 0;
	background: var(--contextMenuBackground);
}

.item {
	color: var(--contextMenuColor);
	padding: .45em 1.6em;
	
	&:hover, &.selected {
		color: var(--contextMenuHoverColor);
		background: var(--contextMenuHoverBackground);
	}
}

.separator {
	height: 1px;
	margin: 4px 0;
	background: var(--appBorderColor);
}
</style>

<div id="main">
	{#each items as item}
		{@const {type, label} = item}
		{#if type === "separator"}
			<div class="separator"></div>
		{:else}
			<div
				class="item"
				class:selected={selectedItem === item}
				onmouseup={() => click(item)}
				onmouseover={() => select(item)}
			>
				{@html label.replace(/%(\w)/, "<u>$1</u>")}
			</div>
		{/if}
	{/each}
</div>
