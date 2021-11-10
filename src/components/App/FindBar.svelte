<script>
import {onMount, getContext} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import {on} from "utils/dom/domEvents";
import Spacer from "components/utils/Spacer.svelte";

let app = getContext("app");

let editor = app.selectedTab.editor;

let blur = function() {
	app.hideFindBarAndFocusEditor();
}

let main;
let input;
let search;
let type = "plain";
let caseMode = "caseSensitive";

if (editor.view.Selection.isMultiline()) {
	search = "";
} else {
	search = editor.getSelectedText();
}

let windowKeymap = {
	"Escape": "close",
};

let inputKeymap = {
	"Enter": "findNext",
	"Shift+Enter": "findPrevious",
};

let functions = {
	close() {
		blur();
	},
	
	findNext() {
		let {
			result,
			loopedFile,
			loopedResults,
		} = editor.find.next() || {};
		
		if (loopedFile) {
			console.log("looped");
		}
		
		if (loopedResults) {
			console.log("loopedResults");
		}
	},
	
	findPrevious() {
		let {
			result,
			loopedFile,
			loopedResults,
		} = editor.find.previous() || {};
		
		if (loopedFile) {
			console.log("looped");
		}
		
		if (loopedResults) {
			console.log("loopedResults");
		}
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
		editor.find.find(search, type, caseMode);
	} else {
		editor.find.reset();
	}
}

function onFocus() {
	
}

onMount(function() {
	main.focus();
	
	input.value = search;
	
	input.focus();
	
	editor.find.reset();
	
	if (search) {
		input.select();
		
		editor.find.find(search, type, caseMode);
	}
	
	let teardown = [
		on(window, "keydown", windowKeydown),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style type="text/scss">
#main {
	display: flex;
	padding: 3px;
}
</style>

<div
	bind:this={main}
	id="main"
	tabindex="0"
	on:focus={onFocus}
>
	<input
		bind:this={input}
		on:keydown={inputKeydown}
		on:input={onInput}
	>
	<Spacer/>
	<button on:click={blur}>x</button>
</div>
