<script>
import {onMount, getContext} from "svelte";

let focusManager = getContext("focusManager");

let blur = function() {
	
}

function onFocus() {
	focusManager.focus(blur);
}

onMount(async function() {
	let teardown = [];
	
	teardown.push(function() {
		focusManager.teardown(blur);
	});
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
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
	left
</div>
