<script lang="ts">
import ProjectSelector from "components/App/ProjectSelector.svelte";
import FileExplorer from "components/App/FileExplorer.svelte";
</script>

<style lang="scss">
#main {
	display: grid;
	grid-template-rows: auto 1fr;
	height: 100%;
}
</style>

<div id="main">
	<div>
		<ProjectSelector/>
	</div>
	<div>
		<FileExplorer/>
	</div>
</div>
