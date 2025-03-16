<script lang="ts">
import FileChooserApp from "platforms/electron/pages/fileChooser/App.svelte";

let {
	tab,
} = $props();

let {fileChooserApp: app} = tab;
</script>

<style lang="scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<FileChooserApp {app}/>
