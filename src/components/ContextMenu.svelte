<script>
import {createEventDispatcher} from "svelte";

export let items;

let fire = createEventDispatcher();

function click(item) {
	fire("click", item);
}
</script>

<style type="text/scss">
#main {
	border: 1px solid #B4BBC1;
	background: white;
}

.item {
	padding: .5em;
	
	&:hover {
		color: white;
		background: #71A339;
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
