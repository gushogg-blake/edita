<script>
import {onMount} from "svelte";
import themeStyle from "components/themeStyle";
import Editor from "components/Editor/Editor.svelte";

export function setValue(value) {
	editor.setValue(value);
}

let editor;

let {theme} = base;

function onThemeUpdated() {
	({theme} = base);
}

onMount(function() {
	let teardown = [
		base.on("themeUpdated", onThemeUpdated),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<div
	id="main"
	style={themeStyle(theme.app)}
>
	<Editor bind:this={editor} border {...$$props}/>
</div>
