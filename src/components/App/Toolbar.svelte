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

button {
	color: #333333;
	border: 0;
	border-radius: 3px;
	padding: .3em .7em;
	outline: none;
	
	&:active {
		box-shadow: inset 1px 1px 3px #00000025;
	}
}
</style>

<div id="main">
	<button on:click={() => app.functions._new()}>
		New
	</button>
	<button on:click={() => app.functions.open()}>
		Open
	</button>
	<button on:click={() => app.functions.save()}>
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
