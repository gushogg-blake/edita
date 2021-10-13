<script>
import {onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import clickButtonFromAccel from "utils/dom/clickButtonFromAccel";
import SnippetEditor from "components/SnippetEditor.svelte";

export let app;

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
	width: 100%;
	height: 100%;
}
</style>

<div id="main">
	<SnippetEditor
		snippet={app.snippet}
		on:saveAndExit={saveAndExit}
		on:cancel={cancel}
	/>
</div>
