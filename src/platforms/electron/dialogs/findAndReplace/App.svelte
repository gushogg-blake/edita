<script>
import getKeyCombo from "utils/getKeyCombo";
import clickButtonFromAccel from "utils/dom/clickButtonFromAccel";
import themeStyle from "components/themeStyle";
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

function done({detail: result}) {
	if (result) {
		window.close();
	}
}
</script>

<svelte:window on:keydown={keydown}/>

<div class="treefrog" style={themeStyle(base.theme)}>
	<FindAndReplace
		{options}
		{findAndReplace}
		on:resize={({detail: contentHeight}) => window.resizeTo(window.innerWidth, contentHeight)}
		on:done={done}
	/>
</div>
