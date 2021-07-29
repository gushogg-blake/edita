<script>
import {onMount, createEventDispatcher, getContext} from "svelte";
import getKeyCombo from "../../utils/getKeyCombo";
import {on} from "../../utils/dom/domEvents";

export let findController;

let fire = createEventDispatcher();

let focusManager = getContext("focusManager");

let blur = function() {
	fire("blur");
}

let main;
let input;
let search = "";
let type = "plain";
let caseMode = "caseSensitive";

let windowKeymap = {
	"Escape": "close",
};

let inputKeymap = {
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

function windowKeydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (windowKeymap[keyCombo]) {
		functions[windowKeymap[keyCombo]]();
	}
}

function inputKeydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (inputKeymap[keyCombo]) {
		functions[inputKeymap[keyCombo]]();
	}
}

function onInput(e) {
	search = input.value;
	
	if (search) {
		findController.search(search, type, caseMode);
	} else {
		findController.reset();
	}
}

function onFocus() {
	focusManager.focus(blur);
}

onMount(function() {
	let teardown = [];
	
	main.focus();
	input.focus();
	
	teardown.push(on(window, "keydown", windowKeydown));
	
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

</style>

<div
	bind:this={main}
	id="main"
	tabindex="0"
	on:focus={onFocus}
>
	<button on:click={blur}>x</button>
	<input
		bind:this={input}
		on:keydown={inputKeydown}
		on:input={onInput}
	>
</div>
