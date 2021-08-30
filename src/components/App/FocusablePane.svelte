<script>
import {onMount, getContext} from "svelte";

let app = getContext("app");

let blur = function() {
	
}

function onFocus() {
	app.focusManager.focus(blur);
}

onMount(function() {
	return function() {
		app.focusManager.teardown(blur);
	}
});
</script>

<style type="text/scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<div id="main" tabindex="0" on:focus={onFocus}>
	<slot/>
</div>
