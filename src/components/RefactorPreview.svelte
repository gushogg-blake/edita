<script>
import Editor from "components/Editor/Editor.svelte";

export let refactorPreview;

let {
} = refactorPreview;
</script>

<style lang="scss">
#main {
	width: 100%;
	height: 100%;
	background: var(--tabSelectedBackground);
}

#controls {
	
	border-bottom: var(--appBorderMedium);
}
</style>

<div id="main">
	<div id="controls">
		test
	</div>
	<div id="editors">
		<div>
			<Editor editor={refactorPreview.editors.find}/>
		</div>
		<div>
			<Editor editor={refactorPreview.editors.preview}/>
		</div>
	</div>
</div>
