<script lang="ts">
import {onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import clickElementFromAccel from "utils/dom/clickElementFromAccel";
import themeStyle from "components/themeStyle";
import SnippetEditor from "components/SnippetEditor.svelte";

let {
	app
} = $props();

async function saveAndExit({detail: snippet}) {
	await app.save(snippet);
	
	window.close();
}

function cancel() {
	window.close();
}

let functions = {
	close() {
		window.close();
	},
};

let keymap = {
	"Escape": "close",
};

function keydown(e) {
	if (clickElementFromAccel(e)) {
		return;
	}
	
	let {keyCombo} = getKeyCombo(e);
	let fnName = keymap[keyCombo];
	
	if (fnName) {
		functions[fnName]();
	}
}
</script>

<svelte:window onkeydown={keydown}/>

<style lang="scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<div id="main" class="edita" style={themeStyle(base.theme.app)}>
	<SnippetEditor
		snippet={app.snippet}
		onsaveAndExit={saveAndExit}
		oncancel={cancel}
	/>
</div>
