<script>
import getKeyCombo from "utils/getKeyCombo";
import resizeWindowToContentHeight from "utils/dom/resizeWindowToContentHeight";
import clickButtonFromAccel from "utils/dom/clickButtonFromAccel";
import FindAndReplace from "components/FindAndReplace.svelte";

export let app;

let {options, findAndReplace} = app;

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

let resize = resizeWindowToContentHeight();
</script>

<svelte:window on:keydown={keydown}/>

<style type="text/scss">

</style>

<div id="main">
	<FindAndReplace
		{options}
		{findAndReplace}
		on:resize={({detail: contentHeight}) => resize(contentHeight)}
	/>
</div>
