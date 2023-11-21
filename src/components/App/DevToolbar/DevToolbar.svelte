<script>
import {onMount, getContext} from "svelte";
import Spacer from "components/utils/Spacer.svelte";
import Checkbox from "components/utils/Checkbox.svelte";
import AstHint from "./AstHint.svelte";

let app = getContext("app");

let {prefs} = base;

function onPrefsUpdated() {
	({prefs} = base);
}

function toggleOpenFindAndReplace(open) {
	base.setPref("dev.openFindAndReplace", open);
	
	if (open) {
		app.showFindAndReplace();
	} else {
		app.hideFindAndReplace();
	}
}

function toggleOpenRefactor(open) {
	base.setPref("dev.openRefactor", open);
	
	if (open) {
		let {path} = app.editorTabs[0] || {};
		
		app.refactor([path || platform.systemInfo.homeDir]);
	} else {
		app.tabs.filter(tab => tab.type === "refactor").forEach(tab => app.closeTab(tab));
	}
}

onMount(function() {
	let teardown = [
		base.on("prefsUpdated", onPrefsUpdated),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
#options {
	display: flex;
	gap: 1em;
	padding: 3px;
}
</style>

<div id="main">
	<div id="options">
		<Checkbox
			label="Theme style element"
			value={prefs.dev.showThemeStyleElement}
			on:change={(e) => base.setPref("dev.showThemeStyleElement", e.target.checked)}
		/>
		<Checkbox
			label="Open refactor"
			value={prefs.dev.openRefactor}
			on:change={(e) => toggleOpenRefactor(e.target.checked)}
		/>
		<Checkbox
			label="Open find & replace"
			value={prefs.dev.openFindAndReplace}
			on:change={(e) => toggleOpenFindAndReplace(e.target.checked)}
		/>
		<Checkbox
			label="Log focused element"
			value={prefs.dev.logFocusedElement}
			on:change={(e) => base.setPref("dev.logFocusedElement", e.target.checked)}
		/>
		<Checkbox
			label="Show theme selector"
			value={prefs.showThemeSelector}
			on:change={(e) => base.setPref("showThemeSelector", e.target.checked)}
		/>
		<Checkbox
			label="Show AST hints"
			value={prefs.dev.showAstHints}
			on:change={(e) => base.setPref("dev.showAstHints", e.target.checked)}
		/>
		<Spacer/>
		<button on:click={() => base.setPref("dev.showToolbar", false)}>
			Hide
		</button>
	</div>
	{#if prefs.dev.showAstHints}
		<AstHint/>
	{/if}
</div>
