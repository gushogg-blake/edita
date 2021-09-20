<script>
import {createEventDispatcher, onMount} from "svelte";
import Editor from "components/Editor/Editor.svelte";

export let snippet;

let {
	name,
	langGroups,
	langs,
	text,
} = snippet;

let fire = createEventDispatcher();

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
		{name}
	</div>
	<div id="editor">
		<Editor bind:value={text}/>
	</div>
</div>
