<script>
import {onMount, getContext} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import Spacer from "components/utils/Spacer.svelte";

let app = getContext("app");

let {editor} = app.selectedTab;
let startCursor = editor.view.Selection.sort().end;
let session;

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

function createSession() {
	if (search) {
		session = editor.api.findAndReplace({
			searchIn: "currentDocument",
			startCursor,
			search,
			type,
			caseMode,
		});
	} else {
		session = null;
	}
}

let inputKeymap = {
	"Enter": "findNext",
	"Shift+Enter": "findPrevious",
	"Escape": "close",
};

let functions = {
	close,
	
	findNext() {
		let {
			loopedFile,
			loopedResults,
		} = session?.next() || {};
		
		if (loopedFile) {
			console.log("looped");
		}
		
		if (loopedResults) {
			console.log("loopedResults");
		}
	},
	
	findPrevious() {
		let {
			loopedFile,
			loopedResults,
		} = session?.previous() || {};
		
		if (loopedFile) {
			console.log("looped");
		}
		
		if (loopedResults) {
			console.log("loopedResults");
		}
	},
};

function inputKeydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (inputKeymap[keyCombo]) {
		functions[inputKeymap[keyCombo]]();
	}
}

function onInput(e) {
	search = input.value;
	
	createSession();
	
	functions.findNext();
}

function close() {
	app.hideFindBarAndFocusEditor();
}

onMount(function() {
	input.value = search;
	
	input.focus();
	
	if (search) {
		input.select();
		
		createSession();
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
>
	<input
		bind:this={input}
		on:keydown={inputKeydown}
		on:input={onInput}
	>
	<Spacer/>
	<button on:click={close}>x</button>
</div>
