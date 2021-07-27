<script>
import {onMount, createEventDispatcher} from "svelte";
import getKeyCombo from "../../utils/getKeyCombo";
import {on} from "../../utils/dom/domEvents";

let fire = createEventDispatcher();

let search = "";

let keymap = {
	"Escape": "close",
	"Enter": "findNext",
	"Shift+Enter": "findPrevious",
};

let functions = {
	close() {
		fire("close");
	},
	
	findNext() {
	},
	
	findPrevious() {
	},
};

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (keymap[keyCombo]) {
		functions[keymap[keyCombo]]();
	}
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
	<button on:click={close}>x</button>
	<input
		bind:value={search}
	>
</div>
