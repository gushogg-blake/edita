<script>
import {onMount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import clickButtonFromAccel from "utils/dom/clickButtonFromAccel";
import Accel from "components/utils/Accel.svelte";
import Gap from "components/utils/Gap.svelte";

export let app;

let {message, buttons} = app.options;

function cancel() {
	window.close();
}

function respond(index) {
	app.respond(index);
	
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
	if (clickButtonFromAccel(e, true)) {
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

#message {
	text-align: center;
	padding: 0 2em;
}

#buttons {
	display: flex;
	justify-content: center;
	gap: .6em;
}
</style>

<div id="main">
	<Gap heightEm={1}/>
	<div id="message">
		{message}
	</div>
	<Gap heightEm={1}/>
	<div id="buttons">
		{#each buttons as button, i}
			<button on:click={() => respond(i)}>
				<Accel label={button}/>
			</button>
		{/each}
	</div>
</div>
