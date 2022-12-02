<script>
import Editor from "components/Editor/Editor.svelte";

export let tab;

let {editor} = tab;
</script>

<Editor {editor}/>
