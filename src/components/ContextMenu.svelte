<script lang="ts">
let {
	items,
	onclick = () => {},
} = $props();

function click(item) {
	onclick(item);
}
</script>

<style lang="scss">
#main {
	border: var(--contextMenuBorder);
	padding: 3px 0;
	background: var(--contextMenuBackground);
}

.item {
	color: var(--contextMenuColor);
	padding: .45em 1.6em;
	
	&:hover {
		color: var(--contextMenuHoverColor);
		background: var(--contextMenuHoverBackground);
	}
}
</style>

<div id="main">
	{#each items as item}
		{@const {type, label} = item}
		{#if type === "separator"}
			<div class="separator"></div>
		{:else}
			<div class="item" onmouseup={() => click(item)}>
				{@html label.replace(/%(\w)/, "<u>$1</u>")}
			</div>
		{/if}
	{/each}
</div>
