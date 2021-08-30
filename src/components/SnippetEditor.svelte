<script>
import {createEventDispatcher, onMount} from "svelte";
import Editor from "./Editor/Editor.svelte";

export let app;
export let snippet;

let fire = createEventDispatcher();

let editor = app.createEditor();

onMount(function() {
	let teardown = [
		
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style type="text/scss">
#main {
	display: grid;
	grid-template-rows: auto 1fr;
	width: 100%;
	height: 100%;
	
}
</style>

<div id="main">
	<div id="name">
		{snippet.name}
	</div>
	<div id="editor">
		<Editor {editor}/>
	</div>
</div>
