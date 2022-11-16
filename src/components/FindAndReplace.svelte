<script>
import {onMount, tick, getContext, createEventDispatcher} from "svelte";
import mapObject from "utils/mapObject";
import getKeyCombo from "utils/getKeyCombo";
import clickButtonFromAccel from "utils/dom/clickButtonFromAccel";
import autoFocusAsync from "components/actions/autoFocusAsync";
import Spacer from "components/utils/Spacer.svelte";
import Accel from "components/utils/Accel.svelte";
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

let {
	replace,
	searchIn,
	search,
	replaceWith,
	regex,
	caseMode,
	word,
	multiline,
	paths,
	searchInSubDirs,
	includePatterns,
	excludePatterns,
	showResults,
} = initOptions;

let smartCase = caseMode === "smart";
let matchCase = caseMode === "caseSensitive";

paths = paths.join(multiPathSeparator);
includePatterns = includePatterns.join(multiPathSeparator);
excludePatterns = excludePatterns.join(multiPathSeparator);

$: options = {
	replace,
	searchIn,
	search,
	replaceWith,
	regex,
	caseMode: smartCase ? "smart" : matchCase ? "caseSensitive" : "caseInsensitive",
	word,
	multiline,
	paths: paths ? paths.split(multiPathSeparator) : [],
	searchInSubDirs,
	includePatterns: includePatterns ? includePatterns.split(multiPathSeparator) : [],
	excludePatterns: excludePatterns ? excludePatterns.split(multiPathSeparator) : [],
	showResults,
};

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

$: optionsChanged(options);

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
	if (clickButtonFromAccel(e, {el: main})) {
		return;
	}
	
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
	grid-template-columns: 1fr auto;
	gap: 1em;
	padding: 8px 12px;
}

.inputs {
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

.actions {
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
>
	<button type="submit" class="hide"></button>
	<div class="inputs">
		<label for="find">
			<Accel label="Fi%nd"/>
		</label>
		<div class="input">
			<input
				bind:this={searchInput}
				bind:value={search}
				id="find"
				accesskey="n"
				use:autoFocusAsync
			>
		</div>
		<label for="replaceWith">
			<Accel label="Rep%lace with"/>
		</label>
		<div class="input">
			<input bind:value={replaceWith} id="replaceWith" accesskey="l">
		</div>
		<div class="input checkboxes">
			<Checkbox bind:checked={regex} label="Rege%x"/>
			<!--<Checkbox bind:checked={smartCase} label="%Smart case"/>-->
			{#if !smartCase}
				<Checkbox bind:checked={matchCase} label="Match %case"/>
			{/if}
			<Checkbox bind:checked={word} label="%Word"/>
			<!--<Checkbox bind:checked={multiline} label="Mul%tiline"/>-->
			<Checkbox bind:checked={replace} label="%Replace"/>
		</div>
		{#if session.message}
			<div id="message">
				{session.message}
			</div>
		{:else}
			<div class="spacer"></div>
		{/if}
		<label for="searchIn">
			<Accel label="Search %in"/>
		</label>
		<div class="input">
			<select bind:value={searchIn} id="searchIn" accesskey="i">
				<option value="currentDocument">Current document</option>
				<option value="selectedText">Selected text</option>
				<option value="openFiles">Open files</option>
				<option value="files">Files</option>
			</select>
		</div>
		{#if searchIn === "files"}
			<label for="paths">
				<Accel label="%Paths"/>
			</label>
			<div class="input">
				<input bind:value={paths} id="paths" accesskey="p">
			</div>
			<div class="input checkboxes">
				<Checkbox bind:checked={searchInSubDirs} label="Search in su%b directories"/>
			</div>
			<label for="include">
				<Accel label="Incl%ude"/>
			</label>
			<div class="input">
				<input bind:value={includePatterns} id="include" accesskey="u">
			</div>
			<label for="exclude">
				<Accel label="%Exclude"/>
			</label>
			<div class="input">
				<input bind:value={excludePatterns} id="exclude" accesskey="e">
			</div>
		{/if}
	</div>
	<div class="actions">
		{#if replace}
			<button on:click={actions.findNext}>
				<Accel label="%Find next"/>
			</button>
			<button on:click={actions.replace}>
				<Accel label="Re%place"/>
			</button>
			<button on:click={actions.replaceAll}>
				<Accel label="Replace %all"/>
			</button>
			<Checkbox bind:value={showResults} label="Sh%ow results"/>
		{:else}
			<button on:click={actions.findPrevious}>
				<Accel label="Find pre%vious"/>
			</button>
			<button on:click={actions.findNext}>
				<Accel label="%Find next"/>
			</button>
			<button on:click={actions.findAll}>
				<Accel label="Find %all"/>
			</button>
		{/if}
		<Spacer/>
		<button on:click={actions.close}>
			<Accel label="Clo%se (Esc)"/>
		</button>
	</div>
</form>
