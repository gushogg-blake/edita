<script>
let fs = require("flowfs");

import {onMount} from "svelte";

import langs from "./modules/langs";
import Document from "./modules/Document";
import Editor from "./components/Editor.svelte";

let document;

onMount(async function() {
	//let code = await fs("test/repos/bluebird/js/browser/bluebird.js").read();
	//let code = await fs("test/repos/acorn/dist/bin.js").read();
	let code = await fs("test/repos/array-find-index/index.js").read();
	
	document = new Document(code, langs.js);
});
</script>

<style type="text/scss">
@import "./css/mixins/flex-col";

#main {
	@include flex-col;
	
	height: 100vh;
}
</style>

<div id="main">
	{#if document}
		<Editor
			{document}
		/>
	{/if}
</div>
