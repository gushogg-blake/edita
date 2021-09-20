<script>
import {onMount, getContext} from "svelte";
import Gap from "components/utils/Gap.svelte";
import FocusablePane from "./FocusablePane.svelte";

let app = getContext("app");

let snippetsByLang;

function updateSnippetGroups() {
	snippetsByLang = {};
	
	for (let snippet of platform.snippets.all()) {
		let langs = snippet.langs.join(", ");
		let groups = snippet.langGroups.join(", ");
		let key = langs + (langs && groups ? ", " : "") + groups;
		
		if (!snippetsByLang[key]) {
			snippetsByLang[key] = [];
		}
		
		snippetsByLang[key].push(snippet);
	}
}

updateSnippetGroups();

onMount(function() {
	let teardown = [
		platform.on("snippetsUpdated", updateSnippetGroups),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style type="text/scss">
#main {
	width: 100%;
	height: 100%;
}

.list {
}

.header {
	padding: .2em;
}

.snippet {
	padding: .2em;
}
</style>

<FocusablePane>
	<div id="main">
		<div class="header">
			Snippets
		</div>
		<Gap height={6}/>
		{#each Object.entries(snippetsByLang) as [key, snippets]}
			<div class="header">
				{key}
			</div>
			<div class="list">
				{#each snippets as snippet}
					<div
						class="snippet"
						on:click={() => app.editSnippet(snippet)}
					>
						{snippet.name}
					</div>
				{/each}
			</div>
		{/each}
	</div>
</FocusablePane>
