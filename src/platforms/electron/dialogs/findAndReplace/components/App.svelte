<script>
import getKeyCombo from "utils/getKeyCombo";
import sleep from "utils/sleep";
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

let firstResize = true;

async function onResize({detail: mainHeight}) {
	let {body} = document;
	
	if (firstResize) {
		await sleep(50);
	}
	
	window.resizeBy(0, -(body.offsetHeight - mainHeight));
	
	while (body.scrollHeight > body.offsetHeight) {
		window.resizeBy(0, 1);
		
		await sleep(1);
	}
	
	firstResize = false;
}
</script>

<svelte:window on:keydown={keydown}/>

<style type="text/scss">
#main {
	width: 100%;
	/*height: 100%;*/
}
</style>

<div id="main">
	<FindAndReplace
		{options}
		{findAndReplace}
		on:resize={onResize}
	/>
</div>
