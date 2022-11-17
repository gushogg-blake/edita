<script>
import {onMount, tick, getContext, createEventDispatcher} from "svelte";
import mapObject from "utils/mapObject";
import getKeyCombo from "utils/getKeyCombo";
import autoFocusAsync from "components/actions/autoFocusAsync";
import accels from "components/actions/accels";
import Spacer from "components/utils/Spacer.svelte";
import Accel from "components/utils/Accel.svelte";
import AccelLabel from "components/utils/AccelLabel.svelte";
import Checkbox from "components/utils/Checkbox.svelte";

let initOptions;
export {initOptions as options};
export let history;

let fire = createEventDispatcher();

let app = getContext("app");

let {findAndReplace} = app;
let {multiPathSeparator} = platform.systemInfo;

let main;
let searchInput;
let session = null;
let optionsChangedSinceLastInit = false;
let mounted = false;
let isMounted = () => mounted;
let loading = false;

createSession();

function createSession() {
	session = {
		hasResult: false,
		message: null,
	};
}

function ensureSession() {
	if (!session) {
		createSession();
	}
}

function optionsChanged() {
	createSession();
	
	optionsChangedSinceLastInit = true;
}

function getFormOptions(options) {
	let {caseMode, paths, includePatterns, excludePatterns} = options;
	
	return {
		...options,
		smartCase: caseMode === "smart",
		matchCase: caseMode === "caseSensitive",
		paths: paths.join(multiPathSeparator),
		includePatterns: includePatterns.join(multiPathSeparator),
		excludePatterns: excludePatterns.join(multiPathSeparator),
	};
}

function getOptions(formOptions) {
	let {smartCase, matchCase, paths, includePatterns, excludePatterns} = formOptions;
	
	return {
		...formOptions,
		caseMode: smartCase ? "smart" : matchCase ? "caseSensitive" : "caseInsensitive",
		paths: paths.split(multiPathSeparator).filter(Boolean),
		includePatterns: includePatterns.split(multiPathSeparator).filter(Boolean),
		excludePatterns: excludePatterns.split(multiPathSeparator).filter(Boolean),
	};
}

let formOptions = getFormOptions(initOptions);

$: options = getOptions(formOptions);

$: optionsChanged(options);

$: if (isMounted()) {
	let {
		regex,
		caseMode,
		word,
		searchInSubDirs,
		includePatterns,
		excludePatterns,
	} = options;
	
	findAndReplace.saveOptions({
		regex,
		caseMode,
		word,
		searchInSubDirs,
		includePatterns,
		excludePatterns,
	});
}

function init() {
	if (optionsChangedSinceLastInit) {
		findAndReplace.reset();
		
		optionsChangedSinceLastInit = false;
	}
}

function action(fn) {
	return async function() {
		if (loading) {
			return;
		}
		
		loading = true;
		
		init();
		setMessage(null);
		
		await fn();
		
		loading = false;
	}
}

let functions = {
	async findAll() {
		let results = await findAndReplace.findAll(options);
		
		if (results.length === 0) {
			setMessage("No occurrences found");
		}
		
		fire("done", results);
	},
	
	async replaceAll() {
		let results = await findAndReplace.replaceAll(options);
		
		if (results.length === 0) {
			setMessage("No occurrences found");
		}
		
		fire("done", results);
	},
	
	async findNext() {
		let {
			done,
			counts,
		} = await findAndReplace.findNext(options);
		
		session.hasResult = !done;
		
		if (done) {
			await endSession(counts);
		}
	},
	
	async findPrevious() {
		let {
			result,
			done,
			counts,
		} = await findAndReplace.findPrevious(options);
		
		session.hasResult = !done;
		
		if (done) {
			await endSession(counts);
		}
	},
	
	async replace() {
		if (!session.hasResult) {
			await functions.findNext();
		}
		
		if (!session.hasResult) {
			return;
		}
		
		await findAndReplace.replace(options);
		await functions.findNext();
	},
	
	close() {
		fire("close");
	},
};

let actions = mapObject(functions, action);

let keymap = {
	"Enter": "findNext",
	"Escape": "close",
};

function keydown(e) {
	let fnName = keymap[getKeyCombo(e).keyCombo];
	
	if (fnName) {
		e.stopPropagation();
		
		actions[fnName]();
	}
}

function submit(e) {
	e.preventDefault();
}

function setMessage(str) {
	session.message = str;
}

function applyHistoryEntry(options) {
	formOptions = getFormOptions(options);
}

async function endSession(counts) {
	let message;
	
	if (counts.total === 0) {
		message = "No occurrences found";
	} else {
		if (options.replace) {
			message = counts.replaced + " of " + counts.total + " occurrences replaced";
		} else {
			message = counts.total + " occurrences found";
		}
	}
	
	setMessage(message);
}

onMount(function() {
	init();
	
	searchInput.select();
	
	mounted = true;
});
</script>

<style lang="scss">
@import "classes/hide";

#main {
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 1em;
	padding: 8px 12px;
}

#history {
	width: 150px;
	border: var(--inputBorder);
	border-radius: 3px;
	background: var(--inputBackground);
}

.historyEntry {
	border-bottom: var(--inputBorder);
	padding: 3px 5px;
}

#inputs {
	display: grid;
	grid-template-columns: auto 1fr;
	grid-auto-rows: min-content;
	align-items: center;
	column-gap: 1em;
	row-gap: 7px;
	
	> label {
		white-space: nowrap;
		grid-column: 1 / 2;
	}
	
	input, select {
		width: 100%;
	}
}

.input {
	grid-column: 2 / 3;
}

.checkboxes {
	display: flex;
	gap: 1em;
}

#message {
	grid-column: 2 / 3;
	border: 1px solid #3d7dcc;
	border-radius: 3px;
	padding: 3px 5px;
	background: #cce3ff;
	/*background: #b6d5fb;*/
}

.spacer {
	grid-column: 1 / 3;
	height: 1em;
}

#actions {
	display: flex;
	flex-direction: column;
	gap: .3em;
}
</style>

<form
	bind:this={main}
	id="main"
	on:submit={submit}
	on:keydown={keydown}
	autocomplete="off"
	tabindex="0"
	use:accels
>
	<button type="submit" class="hide"></button>
	<div id="history">
		{#each history as {options}}
			<div class="historyEntry" on:click={() => applyHistoryEntry(options)}>
				{options.search}
			</div>
		{/each}
	</div>
	<div id="inputs">
		<AccelLabel for="find" label="Fi%nd"/>
		<div class="input">
			<input
				bind:this={searchInput}
				bind:value={formOptions.search}
				id="find"
				use:autoFocusAsync
			>
		</div>
		<AccelLabel for="replaceWith" label="Rep%lace with"/>
		<div class="input">
			<input bind:value={formOptions.replaceWith} id="replaceWith">
		</div>
		<div class="input checkboxes">
			<Checkbox bind:checked={formOptions.regex} label="Rege%x"/>
			<Checkbox bind:checked={formOptions.smartCase} label="%Smart case"/>
			{#if formOptions.smartCase}
				<Checkbox label="Match %case" disabled/>
			{:else}
				<Checkbox bind:checked={formOptions.matchCase} label="Match %case"/>
			{/if}
			<Checkbox bind:checked={formOptions.word} label="%Word"/>
			<!--<Checkbox bind:checked={formOptions.multiline} label="Mul%tiline"/>-->
			<Checkbox bind:checked={formOptions.replace} label="%Replace"/>
		</div>
		{#if session.message}
			<div id="message">
				{session.message}
			</div>
		{:else}
			<div class="spacer"></div>
		{/if}
		<AccelLabel for="searchIn" label="Search %in"/>
		<div class="input">
			<select bind:value={formOptions.searchIn} id="searchIn">
				<option value="currentDocument">Current document</option>
				<option value="selectedText">Selected text</option>
				<option value="openFiles">Open files</option>
				<option value="files">Files</option>
			</select>
		</div>
		{#if formOptions.searchIn === "files"}
			<AccelLabel for="paths" label="%Paths"/>
			<div class="input">
				<input bind:value={formOptions.paths} id="paths">
			</div>
			<div class="input checkboxes">
				<Checkbox bind:checked={formOptions.searchInSubDirs} label="Search in su%b directories"/>
			</div>
			<AccelLabel for="include" label="Incl%ude"/>
			<div class="input">
				<input bind:value={formOptions.includePatterns} id="include">
			</div>
			<AccelLabel for="exclude" label="%Exclude"/>
			<div class="input">
				<input bind:value={formOptions.excludePatterns} id="exclude">
			</div>
		{/if}
	</div>
	<div id="actions">
		{#if formOptions.replace}
			<button on:click={actions.findNext} disabled={!formOptions.search}>
				<Accel label="%Find next"/>
			</button>
			<button on:click={actions.replace} disabled={!formOptions.search}>
				<Accel label="Re%place"/>
			</button>
			<button on:click={actions.replaceAll} disabled={!formOptions.search}>
				<Accel label="Replace %all"/>
			</button>
			<Checkbox bind:value={formOptions.showResults} label="Sh%ow results"/>
		{:else}
			<button on:click={actions.findPrevious} disabled={!formOptions.search}>
				<Accel label="Find pre%vious"/>
			</button>
			<button on:click={actions.findNext} disabled={!formOptions.search}>
				<Accel label="%Find next"/>
			</button>
			<button on:click={actions.findAll} disabled={!formOptions.search}>
				<Accel label="Find %all"/>
			</button>
		{/if}
		<Spacer/>
		<button on:click={actions.close}>
			<Accel label="Close (Esc)"/>
		</button>
	</div>
</form>
