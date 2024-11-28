<script>
import FileChooserApp from "platforms/electron/dialogs/fileChooser/FileChooserApp.svelte";

export let tab;

let {fileChooserApp: app} = tab;
</script>

<style lang="scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<FileChooserApp {app}/>
