<script>
import {createEventDispatcher} from "svelte";

let fire = createEventDispatcher();

function open() {
	fire("open");
}

function _new() {
	fire("new");
}

function save() {
	fire("save");
}
</script>

<style type="text/scss">
#main {
	padding: 3px;
}
</style>

<div id="main">
	<button on:click={_new}>
		New
	</button>
	<button on:click={open}>
		Open
	</button>
	<button on:click={save}>
		Save
	</button>
</div>
