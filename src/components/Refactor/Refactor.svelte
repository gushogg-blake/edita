<script lang="ts">
import {run, preventDefault} from "svelte/legacy";
import {onMount, getContext} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import accels from "components/actions/accels";
import Accel from "components/utils/Accel.svelte";
import AccelLabel from "components/utils/AccelLabel.svelte";
import Gap from "components/utils/Gap.svelte";
import Spacer from "components/utils/Spacer.svelte";
import Editor from "components/Editor/Editor.svelte";

let {
	refactor,
} = $props();

let app = getContext("app");

let {
	options,
} = refactor;

let findEditor = $state();
let replaceWithEditor = $state();

let formOptions = $state(getFormOptions(refactor.options));


function getFormOptions(options) {
	let {globs} = options;
	
	return {
		...options,
		globs: globs.join(platform.systemInfo.multiPathSeparator),
	};
}

function getOptions(formOptions) {
	let {globs} = formOptions;
	
	return {
		...formOptions,
		globs: globs.split(platform.systemInfo.multiPathSeparator),
	};
}

function onOptionsChanged() {
	({options} = refactor);
}

function updatePaths() {
	refactor.updatePaths();
}

function replaceAll() {
	refactor.replaceAll();
}

onMount(function() {
	let teardown = [
		refactor.on("optionsChanged", onOptionsChanged),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
run(() => {
		refactor.setOptions(getOptions(formOptions));
	});
</script>

<style lang="scss">
#main {
	display: grid;
	grid-template-rows: auto 1fr;
	width: 100%;
	height: 100%;
	padding: 8px;
}

#controls {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
}

#actions {
	display: flex;
	justify-content: flex-end;
}

#editors {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
}

#editors > div {
	display: grid;
	grid-template-rows: auto 1fr;
}

.header {
	padding: 3px 0px;
}

.editor {
	height: 100%;
}
</style>

<div id="main">
	<div id="controls">
		<form id="options" onsubmit={preventDefault(updatePaths)}>
			<AccelLabel for="globs" label="F%iles"/>
			<input bind:value={formOptions.globs} id="globs">
			<button type="submit">
				<Accel label={"%Preview"}/>
			</button>
		</form>
		<div id="actions">
			<button onclick={replaceAll}>
				<Accel label={"Replace %all"}/>
			</button>
		</div>
	</div>
	<div id="editors">
		<div>
			<div class="header">
				<AccelLabel for={findEditor} label="%Find"/>
			</div>
			<div class="editor">
				<Editor
					bind:this={findEditor}
					editor={refactor.editors.find}
					border
				/>
			</div>
		</div>
		<div>
			<div class="header">
				<AccelLabel for={replaceWithEditor} label="Rep%lace with"/>
			</div>
			<div class="editor">
				<Editor
					bind:this={replaceWithEditor}
					editor={refactor.editors.replaceWith}
					border
				/>
			</div>
		</div>
	</div>
</div>
