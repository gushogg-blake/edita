<script>
import {onMount} from "svelte";
import {on} from "../../utils/dom/domEvents";

function keydown(e) {
	console.log(e);
}

onMount(function() {
	let teardown = [];
	
	teardown.push(on(window, "keydown", keydown));
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style type="text/scss">

</style>

<div id="main">
	
</div>
