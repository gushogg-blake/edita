<script lang="ts">
import {onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import autoFocusAsync from "components/actions/autoFocusAsync";
import Checkbox from "components/utils/Checkbox.svelte";
import Editor from "components/Editor/Editor.svelte";

let {
	snippet,
	onsaveAndExit = () => {},
	oncancel = () => {},
} = $props();

let {
	name,
	langGroups,
	langs,
	text,
	isDynamic,
	keyCombo: assignedKeyCombo,
} = $state(snippet);

langGroups = langGroups.join(", ");
langs = langs.join(", ");

let editor = $state();

function cancel() {
	oncancel();
}

function saveAndExit() {
	if (!name) {
		return;
	}
	
	onsaveAndExit({
		name,
		langGroups: langGroups.split(", "),
		langs: langs.split(", "),
		text,
		isDynamic,
		keyCombo: assignedKeyCombo || null,
	});
}

function submit(e) {
	e.preventDefault();
	
	saveAndExit();
}

let functions = {
	saveAndExit,
	cancel,
};

let keymap = {
	"Ctrl+Enter": "saveAndExit",
	"Escape": "cancel",
};

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	let fnName = keymap[keyCombo];
	
	if (fnName) {
		functions[fnName]();
	}
}

function onToggleDynamic() {
	if (isDynamic) {
		wrap();
	} else {
		unwrap();
	}
}

function setKeyCombo(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (["Ctrl", "Alt", "Shift", "Command"].some(modifier => keyCombo.includes(modifier + "+"))) {
		e.preventDefault();
		e.stopPropagation();
		
		assignedKeyCombo = keyCombo;
	} else if (["Backspace", "Delete"].includes(keyCombo)) {
		assignedKeyCombo = null;
	}
}

function wrap() {
	//let {newline, indentation} = editor.getEditor().document.format;
}

async function unwrap() {
	
}

onMount(function() {
	editor.setValue(text);
});
</script>

<style lang="scss">
#main {
	display: grid;
	grid-template-rows: auto 1fr auto auto;
	gap: 5px;
	width: 100%;
	height: 100%;
	padding: 5px;
}

#details {
	display: grid;
	grid-template-columns: 1fr auto auto;
	gap: 1em;
}

.field {
	display: flex;
	align-items: center;
	gap: .5em;
}

input {
	width: 10em;
}

input#name {
	width: 6em;
}

#actions {
	display: flex;
	justify-content: flex-end;
	gap: .5em;
}
</style>

<form
	id="main"
	onsubmit={submit}
	onkeydown={keydown}
	autocomplete="off"
>
	<div id="details">
		<div class="field">
			<label for="name">
				Abbreviation
			</label>
			<input bind:value={name} id="name" use:autoFocusAsync>
		</div>
		<div class="field">
			<label for="langGroups">
				Language groups
			</label>
			<input bind:value={langGroups} id="langGroups">
		</div>
		<div class="field">
			<label for="langs">
				Languages
			</label>
			<input bind:value={langs} id="langs">
		</div>
	</div>
	<div id="editor">
		<Editor bind:this={editor} bind:value={text}/>
	</div>
	<div class="options">
		<div class="field">
			<label for="keyCombo">
				Key combo
			</label>
			<input
				bind:value={assignedKeyCombo}
				id="keyCombo"
				readonly
				onkeydown={setKeyCombo}
			>
		</div>
	</div>
	<!--<div class="options">-->
	<!--	<Checkbox-->
	<!--		bind:value={isDynamic}-->
	<!--		onchange={onToggleDynamic}-->
	<!--		label="Dynamic"-->
	<!--	/>-->
	<!--</div>-->
	<div id="actions">
		<button type="button" onclick={cancel}>Cancel</button>
		<button type="submit">OK</button>
	</div>
</form>
