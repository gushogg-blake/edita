<script>
import {onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import SnippetEditor from "components/SnippetEditor.svelte";

export let app;

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
	<SnippetEditor snippet={app.snippet}/>
</div>
