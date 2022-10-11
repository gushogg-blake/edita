<script>
import {onMount, createEventDispatcher} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import clickButtonFromAccel from "utils/dom/clickButtonFromAccel";
import Accel from "components/utils/Accel.svelte";
import Gap from "components/utils/Gap.svelte";

export let options;

let fire = createEventDispatcher();

let {message, buttons} = options;

let main;

function respond(response) {
	fire("response", response);
}

let functions = {
	close() {
		respond(null);
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

onMount(function() {
	main.focus();
});
</script>

<style lang="scss">
#main {
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

<div bind:this={main} id="main" tabindex="0" on:keydown={keydown}>
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
