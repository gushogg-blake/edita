<script>
import Editor from "components/Editor/Editor.svelte";

export let refactorPreview;

let {
	selectedFile,
} = refactorPreview;
</script>

<style lang="scss">
#main {
	display: grid;
	grid-template-rows: auto 1fr;
	width: 100%;
	height: 100%;
	background: var(--tabSelectedBackground);
}

#controls {
	
	border-bottom: var(--appBorderMedium);
}

#editors, #controls {
	display: grid;
	grid-template-columns: 1fr 1fr;
}

#editors {
	
}
</style>

<div id="main">
	<div id="controls">
		{selectedFile?.path}
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
