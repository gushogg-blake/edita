<script>
let fs = require("flowfs");

import {onMount} from "svelte";

import langs from "./modules/langs";
import Document from "./modules/Document";
import Editor from "./components/Editor.svelte";

let document;

onMount(async function() {
	let code = await fs("test/repos/bluebird/js/browser/bluebird.js").read();
	//let code = await fs("test/repos/acorn/dist/bin.js").read();
	//let code = await fs("test/repos/array-find-index/index.js").read();
	
	document = new Document(code, langs.js);
});
</script>

<style type="text/scss">
@import "./css/mixins/flex-col";

#main {
	display: grid;
	grid-template-rows: auto auto 1fr auto;
	grid-template-columns: auto 1fr auto;
	grid-template-areas:
		"toolbar toolbar toolbar"
		"left tabs right"
		"left editor right"
		"bottom bottom bottom";
	width: 100vw;
	height: 100vh;
	user-select: none;
}

#toolbar {
	grid-area: toolbar;
}

#left {
	grid-area: left;
}

#tabs {
	grid-area: tabs;
}

#editor {
	grid-area: editor;
}

#bottom {
	grid-area: bottom;
}
</style>

<div id="main">
	<div id="toolbar">
		tooblar
	</div>
	<div id="left">
		left
	</div>
	<div id="tabs">
		tabs
	</div>
	<div id="editor">
		{#if document}
			<Editor
				{document}
			/>
		{/if}
	</div>
	<div id="bottom">
		bottom
	</div>
</div>
