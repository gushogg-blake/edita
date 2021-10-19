<script>
import {createEventDispatcher, onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import importFromString from "utils/importFromString";
import Checkbox from "components/utils/Checkbox.svelte";
import Editor from "components/Editor/Editor.svelte";

export let snippet;

let fire = createEventDispatcher();

let {
	name,
	langGroups,
	langs,
	text,
	isDynamic,
	keyCombo: assignedKeyCombo,
} = snippet;

langGroups = langGroups.join(", ");
langs = langs.join(", ");

let editor;

function cancel() {
	fire("cancel");
}

function saveAndExit() {
	if (!name) {
		return;
	}
	
	fire("saveAndExit", {
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
	//let {newline, indentation} = editor.getEditor().document.fileDetails;
}

async function unwrap() {
	
}

onMount(function() {
	editor.setValue(text);
});
</script>

<style type="text/scss">
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
	on:submit={submit}
	on:keydown={keydown}
	autocomplete="off"
>
	<div id="details">
		<div class="field">
			<label for="name">
				Abbreviation
			</label>
			<input bind:value={name} id="name" autofocus>
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
				on:keydown={setKeyCombo}
			>
		</div>
	</div>
	<div class="options">
		<Checkbox
			bind:checked={isDynamic}
			on:change={onToggleDynamic}
			label="Dynamic"
		/>
	</div>
	<div id="actions">
		<button type="button" on:click={cancel}>Cancel</button>
		<button type="submit">OK</button>
	</div>
</form>
