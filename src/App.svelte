<script>
let fs = require("flowfs");

import {onMount} from "svelte";
import Document from "../core/Document";
import Editor from "../components/Editor/Editor.svelte";

let prefs = {
	font: "14px DejaVu Sans Mono",
	//lineHeight: 18,
	indentWidth: 4,
	
	lineNumberColor: "#9f9f9f",
	
	langs: {
		js: {
			colors: {
				keyword: "#aa33aa",
				id:  "#202020",
				comment: "#7f7f7f",
				symbol: "#bb22bb",
				number: "#cc2222",
				string: "#2233bb",
				regex: "#cc7030",
			},
		},
	},
};

let document;

onMount(async function() {
	let code = await fs("test/repos/bluebird/js/browser/bluebird.js").read();
	
	document = new Document(code, "js");
});
</script>

<style>
@import "../css/mixins/flex-col";

#main {
	@include flex-col;
	
	height: 100vh;
}
</style>

<div id="main">
	{#if document}
		<Editor {document} {prefs}/>
	{/if}
</div>
