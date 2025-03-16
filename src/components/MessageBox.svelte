<script lang="ts">
import {onMount, createEventDispatcher} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import clickElementFromAccel from "utils/dom/clickElementFromAccel";
import Accel from "components/utils/Accel.svelte";
import Gap from "components/utils/Gap.svelte";

let {
	options,
	onresponse = () => {},
} = $props();

let fire = createEventDispatcher();

let {message, buttons} = options;

let main = $state();

function respond(response) {
	onresponse(response);
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
	if (clickElementFromAccel(e, {noAlt: true})) {
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

<div bind:this={main} id="main" tabindex="0" onkeydown={keydown}>
	<Gap heightEm={1}/>
	<div id="message">
		{message}
	</div>
	<Gap heightEm={1}/>
	<div id="buttons">
		{#each buttons as button, i}
			<button onclick={() => respond(i)}>
				<Accel label={button}/>
			</button>
		{/each}
	</div>
</div>
