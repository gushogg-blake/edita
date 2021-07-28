<script>
import {onMount, createEventDispatcher} from "svelte";
import getKeyCombo from "../../utils/getKeyCombo";
import {on} from "../../utils/dom/domEvents";

let fire = createEventDispatcher();

let blur = function() {
	fire("close");
}

let main;
let search = "";

let keymap = {
	"Escape": "close",
	"Enter": "findNext",
	"Shift+Enter": "findPrevious",
};

let functions = {
	close() {
		blur();
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

function onFocus() {
	fire("focus", blur);
}

onMount(function() {
	let teardown = [];
	
	main.focus();
	
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

<div
	bind:this={main}
	id="main"
	tabindex="0"
	on:focus={onFocus}
>
	<button on:click={blur}>x</button>
	<input
		bind:value={search}
	>
</div>
