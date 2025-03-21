<script lang="ts">
import {onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import autoFocusAsync from "components/actions/autoFocusAsync";
import Checkbox from "components/utils/Checkbox.svelte";
import Textarea from "components/Textarea.svelte";

let {
	app,
} = $props();

let {snippet} = app;

let name = $state(snippet.name);
let langGroups = $state(snippet.langGroups);
let langs = $state(snippet.langs);
let text = $state(snippet.text);
//let isDynamic = $state(snippet.isDynamic);
let assignedKeyCombo = $state(snippet.keyCombo);

langGroups = langGroups.join(", ");
langs = langs.join(", ");

let editor = $state();

function cancel() {
	app.close();
}

function saveAndClose() {
	if (!name) {
		return;
	}
	
	app.saveAndClose({
		name,
		langGroups: langGroups.split(", "),
		langs: langs.split(", "),
		text,
		//isDynamic,
		keyCombo: assignedKeyCombo || null,
	});
}

function submit(e) {
	e.preventDefault();
	
	saveAndClose();
}

let functions = {
	saveAndClose,
	cancel,
};

let keymap = {
	"Ctrl+Enter": "saveAndClose",
	"Escape": "cancel",
};

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	let fnName = keymap[keyCombo];
	
	if (fnName) {
		functions[fnName]();
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
</script>

<style lang="scss">
#main {
	display: grid;
	grid-template-rows: auto 1fr auto;
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

#optionsAndActions {
	display: grid;
	grid-template-columns: 1fr auto;
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
		<Textarea bind:value={text}/>
	</div>
	<div id="optionsAndActions">
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
			<button type="submit">Save</button>
		</div>
	</div>
</form>
