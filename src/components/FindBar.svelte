<script lang="ts">
import {onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import type EditorTab from "ui/app/tabs/EditorTab";
import {getApp} from "components/context";
import Spacer from "components/utils/Spacer.svelte";

let app = getApp();

let {editor} = app.mainTabs.selectedTab as EditorTab;
let startCursor = editor.normalSelection.right;
let session;

let main: HTMLDivElement = $state();
let input: HTMLInputElement = $state();
let search;
let type = "plain";
let caseMode = "caseSensitive";

if (editor.normalSelection.isMultiline()) {
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

<style lang="scss">
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
		onkeydown={inputKeydown}
		oninput={onInput}
	>
	<Spacer/>
	<button onclick={close}>x</button>
</div>
