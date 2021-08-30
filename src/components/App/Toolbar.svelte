<script>
import {getContext} from "svelte";

let app = getContext("app");
</script>

<style type="text/scss">
#main {
	padding: 3px;
	background: #f2f2f0;
	//background: white;
}
</style>

<div id="main">
	<button on:click={() => app.newFile()}>
		New
	</button>
	<button on:click={() => app.open()}>
		Open
	</button>
	<button on:click={() => app.save()}>
		Save
	</button>
	<button on:click={() => app.togglePane("left")}>
		[
	</button>
	<button on:click={() => app.togglePane("bottom")}>
		_
	</button>
	<button on:click={() => app.togglePane("right")}>
		]
	</button>
</div>
