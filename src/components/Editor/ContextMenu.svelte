<script>
import {createEventDispatcher} from "svelte";

export let items;

let fire = createEventDispatcher();

function mouseup(item) {
	item.onClick();
	
	fire("action");
}
</script>

<style type="text/scss">
#main {
	font-size: 14px;
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
		<div class="item" on:mouseup={() => mouseup(item)}>
			{item.label}
		</div>
	{/each}
</div>
