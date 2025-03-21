<script lang="ts">
import {onMount, tick} from "svelte";
import Editor from "components/Editor/Editor.svelte";

let {
	value = $bindable(""),
} = $props();

let editor = base.createEditorForTextArea(value);
let isEditing = false;

$effect(() => {
	if (!isEditing) {
		editor.setValue(value);
	}
});

async function update() {
	isEditing = true;
	
	value = editor.getValue();
	
	await tick();
	
	isEditing = false;
}
</script>

<style lang="scss">
#main {
	width: 100%;
	height: 100%;
	border: var(--inputBorder);
	border-radius: var(--inputBorderRadius);
}
</style>

<div id="main">
	<Editor mode="textarea" {editor}/>
</div>
