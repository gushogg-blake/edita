<script>
import {onMount} from "svelte";
import Spacer from "components/utils/Spacer.svelte";
import Checkbox from "components/utils/Checkbox.svelte";

let {prefs} = base;

function onPrefsUpdated() {
	({prefs} = base);
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
		label="Show find & replace"
		value={prefs.dev.showFindAndReplace}
		on:change={(e) => base.setPref("dev.showFindAndReplace", e.target.checked)}
	/>
	<Spacer/>
	<button on:click={() => base.setPref("dev.showToolbar", false)}>
		Hide
	</button>
</div>
