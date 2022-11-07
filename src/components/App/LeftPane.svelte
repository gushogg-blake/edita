<script>
import FileExplorer from "components/FileExplorer.svelte";
import ProjectSelector from "components/ProjectSelector.svelte";
</script>

<style lang="scss">
#main {
	display: grid;
	grid-template-rows: auto 1fr;
	height: 100%;
}
</style>

<div id="main">
	{#if platform.supports.projects}
		<div>
			<ProjectSelector/>
		</div>
	{/if}
	<div>
		<FileExplorer/>
	</div>
</div>
