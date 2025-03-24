<script lang="ts">
import Editor from "components/Editor/Editor.svelte";

let {
	tab,
} = $props();

let {editor} = tab;
</script>

<Editor {editor}/>
