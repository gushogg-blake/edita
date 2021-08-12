<script>
import {getContext} from "svelte";

let app = getContext("app");

function open() {
	app.open();
}

function _new() {
	app.newFile();
}

function save() {
	app.save();
}
</script>

<style type="text/scss">
#main {
	padding: 3px;
	background: white;
	/*background: #E5E5E3;*/
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
