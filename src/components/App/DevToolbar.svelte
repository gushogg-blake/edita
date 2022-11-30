<script>
import {onMount, getContext} from "svelte";
import Spacer from "components/utils/Spacer.svelte";
import Checkbox from "components/utils/Checkbox.svelte";

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
#main {
	display: flex;
	gap: 1em;
	padding: 3px;
}
</style>

<div id="main">
	<Checkbox
		label="Theme style element"
		value={prefs.dev.showThemeStyleElement}
		on:change={(e) => base.setPref("dev.showThemeStyleElement", e.target.checked)}
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
	<Spacer/>
	<button on:click={() => base.setPref("dev.showToolbar", false)}>
		Hide
	</button>
</div>
