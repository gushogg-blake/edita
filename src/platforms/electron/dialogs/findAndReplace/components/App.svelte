<script>
import {onMount, setContext} from "svelte";
import getKeyCombo from "utils/getKeyCombo";

export let app;

setContext("app", app);

let functions = {
	
};

function keydown(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (functions[keyCombo]) {
		functions[keyCombo]();
	}
}

</script>

<svelte:window on:keydown={keydown}/>

<style type="text/scss">
#main {
	display: grid;
	grid-template-columns: auto 1fr auto auto;
	grid-auto-rows: min-content;
	/*grid-template-rows: auto auto;*/
	align-items: center;
	column-gap: 1em;
	row-gap: 7px;
	width: 100%;
	height: 100%;
	padding: 8px 12px;
}

.label {
	grid-column: 1 / 2;
}

.input {
	grid-column: 2 / 3;
}

.misc {
	grid-column: 3 / 4;
}

.actions {
	grid-column: 4 / 5;
}
</style>

<div id="main">
	<div class="label">
		label4565
	</div>
	<div class="input">
		<input>
	</div>
	<div class="actions">
		actions
	</div>
	<div class="label">
		label
	</div>
	<div class="input">
		<input>
	</div>
	<div class="misc">
		misc
	</div>
	<div class="actions">
		actions
	</div>
</div>
