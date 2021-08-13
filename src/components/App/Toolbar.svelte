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
	background: #f2f2f0;
	//background: white;
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
