<script>
import {onMount, getContext} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
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

function newSnippet() {
	app.newSnippet();
}

function newSnippetInList(list) {
	let {langGroups, langs} = list[0];
	
	app.newSnippet({
		langGroups,
		langs,
	});
}

function showContextMenuForSnippet(e, snippet) {
	platform.showContextMenu(e, [
		{
			label: "&Delete",
			
			onClick() {
				platform.snippets.delete(snippet.id);
			},
		},
	]);
}

$: mainStyle = {
	width: 150,
};

onMount(function() {
	let teardown = [
		platform.snippets.on("new", updateSnippetGroups),
		platform.snippets.on("update", updateSnippetGroups),
		platform.snippets.on("delete", updateSnippetGroups),
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

#title {
	padding: 5px;
}

.list {
}

.entry {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 2px 5px 2px 3px;
}

.snippet {
	cursor: pointer;
	
	&:hover {
		text-decoration: underline;
	}
}

.list .entry.snippet {
	padding: 2px 5px 2px 1.2em;
}

.icon {
	flex-shrink: 0;
	width: 12px;
	height: 12px;
	border-radius: 3px;
}

.dirIcon {
	background: #b9d7f1;
}

.fileIcon {
	background: #fbfbfb;
}
</style>

<FocusablePane>
	<div id="main" style={inlineStyle(mainStyle)}>
		<div id="title">
			Snippets
		</div>
		<Gap height={6}/>
		{#each Object.entries(snippetsByLang) as [key, snippets]}
			<div class="entry header">
				<div class="icon dirIcon"></div>
				<div class="name">
					{key}
				</div>
			</div>
			<div class="list">
				{#each snippets as snippet}
					<div
						class="entry snippet"
						on:click={() => app.editSnippet(snippet.id)}
						on:contextmenu={(e) => showContextMenuForSnippet(e, snippet)}
					>
						<div class="icon fileIcon"></div>
						<div class="name">
							{snippet.name}
						</div>
					</div>
				{/each}
				<div
					class="entry snippet"
					on:click={() => newSnippetInList(snippets)}
				>
					<div class="icon fileIcon"></div>
					<div class="name">
						New
					</div>
				</div>
			</div>
		{/each}
		<div
			class="entry snippet"
			on:click={() => newSnippet()}
		>
			<div class="icon fileIcon"></div>
			<div class="name">
				New
			</div>
		</div>
	</div>
</FocusablePane>
