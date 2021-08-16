<script>
import {onMount, getContext} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import {on} from "utils/dom/domEvents";

let app = getContext("app");

let editor = app.selectedTab.editor;

let blur = function() {
	editor.find.reset();
	
	app.hideFindBarAndFocusEditor();
}

let main;
let input;
let search;
let type = "plain";
let caseMode = "caseSensitive";

if (editor.view.Selection.isMultiline()) {
	console.log(editor.view.normalSelection)
	search = "";
} else {
	console.log(editor.view.normalSelection)
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
		editor.find.search(search, type, caseMode);
	} else {
		editor.find.reset();
	}
}

function onFocus() {
	app.focusManager.focus(blur);
}

onMount(function() {
	main.focus();
	
	input.value = search;
	
	input.focus();
	
	if (search) {
		 input.select();
		 
		 editor.find.search(search, type, caseMode);
	}
	
	let teardown = [
		on(window, "keydown", windowKeydown),
		
		function() {
			app.focusManager.teardown(blur);
		},
	];
	
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
