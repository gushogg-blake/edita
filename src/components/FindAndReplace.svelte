<script>
import {onMount} from "svelte";
import Accel from "components/utils/Accel.svelte";
import Checkbox from "components/utils/Checkbox.svelte";

export let options;
export let findAndReplace;

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
} = options;

let smartCase = caseMode === "smart";
let matchCase = caseMode === "caseSensitive";

$: options = {
	replace,
	searchIn,
	find,
	replaceWith,
	regex,
	caseMode: smartCase ? "smart" : matchCase ? "caseSensitive" : "caseInsensitive",
	word,
	multiline,
	paths,
	searchInSubDirs,
	includeGlob,
	excludeGlob,
};

let functions = {
	async findAll() {
		console.log(await findAndReplace.findAll(options));
	},
	
	replaceAll(options) {
		return platform.callParentWindow("findAndReplace", "replaceAll", options);
	},
	
	findNext(options) {
		return platform.callParentWindow("findAndReplace", "findNext", options);
	},
	
	findPrevious(options) {
		return platform.callParentWindow("findAndReplace", "findPrevious", options);
	},
	
	replace(options) {
		return platform.callParentWindow("findAndReplace", "replace", options);
	},
};
</script>

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

.checkboxes {
	display: flex;
	gap: 1em;
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
		<div class="input checkboxes">
			<Checkbox bind:checked={regex} label="Rege&x"/>
			<Checkbox bind:checked={smartCase} label="&Smart case"/>
			{#if !smartCase}
				<Checkbox bind:checked={matchCase} label="Match &case"/>
			{/if}
			<Checkbox bind:checked={word} label="&Word"/>
			<Checkbox bind:checked={multiline} label="Mul&tiline"/>
			<Checkbox bind:checked={replace} label="&Replace"/>
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
