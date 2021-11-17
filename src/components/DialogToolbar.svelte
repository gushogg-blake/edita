<script>
import {createEventDispatcher} from "svelte";

export let title = "";

let fire = createEventDispatcher();
</script>

<style type="text/scss">
#main {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 3px;
	background: var(--toolbarBackgroundColor);
}

#title {
	font-weight: bold;
	text-align: center;
	flex-grow: 1;
}
</style>

<div id="main">
	<div id="title">
		{title}
	</div>
	<div id="buttons">
		<button on:click={() => fire("close")}>x</button>
	</div>
</div>
