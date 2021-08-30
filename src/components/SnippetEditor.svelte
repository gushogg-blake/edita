<script>
import {createEventDispatcher} from "svelte";

export let snippet;

let fire = createEventDispatcher();


</script>

<style type="text/scss">
#main {
	width: 100%;
	height: 100%;
	background: white;
}
</style>

<div id="main">
	{snippet.name}
</div>
