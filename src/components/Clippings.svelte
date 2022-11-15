<script>
import {getContext} from "svelte";
import Editor from "components/Editor/Editor.svelte";

let app = getContext("app");
</script>

<Editor editor={app.bottomPane.clippingsEditor}/>
