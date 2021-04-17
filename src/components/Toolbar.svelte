<script>
import {createEventDispatcher} from "svelte";

let fire = createEventDispatcher();

function open() {
	fire("open");
}
</script>

<style type="text/scss">

</style>

<div id="main">
	<button on:click={open}>
		Open
	</button>
</div>
