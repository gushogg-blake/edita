<script>
import {onMount, setContext} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import clickButtonFromAccel from "utils/dom/clickButtonFromAccel";
import Accel from "components/utils/Accel.svelte";

export let app;

setContext("app", app);

let {
	replace,
	searchIn,
	find,
	replaceWith,
	regex,
	caseMode,
	word,
	multiline,
	paths,
	searchInSubDirs,
	includeGlob,
	excludeGlob,
} = app.options;

$: app.setOptions({
	replace,
	searchIn,
	find,
	replaceWith,
	regex,
	caseMode,
	word,
	multiline,
	paths,
	searchInSubDirs,
	includeGlob,
	excludeGlob,
});

let functions = {
	findAll() {
		app.findAll();
	},
	
	replaceAll() {
		app.replaceAll();
	},
	
	findNext() {
	},
	
	findPrevious() {
	},
	
	replace() {
	},
	
	close() {
		window.close();
	},
};

let keymap = {
	"Escape": "close",
};

function keydown(e) {
	if (clickButtonFromAccel(e)) {
		return;
	}
	
	let {keyCombo} = getKeyCombo(e);
	let fnName = keymap[keyCombo];
	
	if (fnName) {
		functions[fnName]();
	}
}

</script>

<svelte:window on:keydown={keydown}/>

<style type="text/scss">
#main {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 1em;
	width: 100%;
	height: 100%;
	padding: 8px 12px;
}

.inputs {
	display: grid;
	grid-template-columns: auto 1fr;
	grid-auto-rows: min-content;
	align-items: center;
	column-gap: 1em;
	row-gap: 7px;
	
}

label {
	grid-column: 1 / 2;
}

.input {
	grid-column: 2 / 3;
}

input {
	width: 100%;
}

.actions {
	display: grid;
	grid-template-columns: auto;
	grid-auto-rows: min-content;
	align-items: center;
}
</style>

<div id="main">
	<div class="inputs">
		<label for="find">
			<Accel label="Fi&nd"/>
		</label>
		<div class="input">
			<input bind:value={find} id="find" accesskey="n">
		</div>
		<label for="replaceWith">
			<Accel label="Rep&lace with"/>
		</label>
		<div class="input">
			<input bind:value={replaceWith} id="replaceWith" accesskey="l">
		</div>
	</div>
	<div class="actions">
		{#if searchIn === "files"}
			{#if replace}
				<button on:click={functions.replaceAll}>
					<Accel label="Replace &all"/>
				</button>
				<label>
					<input type="checkbox" accesskey="m">
					<Accel label="Confir&m"/>
				</label>
			{:else}
				<button on:click={functions.findAll}>
					<Accel label="Find &all"/>
				</button>
			{/if}
		{:else}
			{#if replace}
				<button on:click={functions.findNext}>
					<Accel label="&Find next"/>
				</button>
				<button on:click={functions.replace}>
					<Accel label="&Find next"/>
				</button>
				<label>
					<input type="checkbox" accesskey="m">
					<Accel label="Confir&m"/>
				</label>
			{:else}
				
			{/if}
		{/if}
	</div>
</div>
