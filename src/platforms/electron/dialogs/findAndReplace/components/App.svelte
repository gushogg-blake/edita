<script>
import {onMount, setContext} from "svelte";
import getKeyCombo from "utils/getKeyCombo";

export let app;

setContext("app", app);

let functions = {
	
};

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (functions[keyCombo]) {
		functions[keyCombo]();
	}
}

</script>

<svelte:window on:keydown={keydown}/>

<style type="text/scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<div id="main">
	
</div>
