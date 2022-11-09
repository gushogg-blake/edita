<script>
import {createEventDispatcher} from "svelte";

export let items;

let fire = createEventDispatcher();

function click(item) {
	fire("click", item);
}
</script>

<style lang="scss">
#main {
	border: var(--contextMenuBorder);
	background: var(--contextMenuBackground);
}

.item {
	color: var(--contextMenuColor);
	padding: .45em .6em;
	
	&:hover {
		color: var(--contextMenuHoverColor);
		background: var(--contextMenuHoverBackground);
	}
}
</style>

<div id="main">
	{#each items as item}
		<div class="item" on:mouseup={() => click(item)}>
			{@html item.label.replace(/%(\w)/, "<u>$1</u>")}
		</div>
	{/each}
</div>
