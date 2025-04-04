<script lang="ts">
import Editor from "components/Editor/Editor.svelte";
import type ClippingsTab from "ui/App/tabs/ClippingsTab";

type Props = {
	tab: ClippingsTab;
};

let {
	tab,
}: Props = $props();

let {editor} = tab;
</script>

<Editor {editor}/>
