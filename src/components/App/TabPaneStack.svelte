<script>
import {setContext} from "svelte";

export let panes;

setContext("setHeight", function(height) {
	// update other heights
});
</script>

<slot/>
