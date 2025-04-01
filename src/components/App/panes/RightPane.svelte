<script lang="ts">
import {onMount, getContext} from "svelte";
import Gap from "components/utils/Gap.svelte";

let app = getContext("app");

let snippetsByLang = $state();

function updateSnippetGroups() {
	snippetsByLang = {};
	
	for (let snippet of base.stores.snippets.all()) {
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
	app.dialogs.newSnippet();
}

function editSnippet(id) {
	app.dialogs.editSnippet(id);
}

function newSnippetInList(list) {
	let {langGroups, langs} = list[0];
	
	app.newSnippet({
		langGroups,
		langs,
	});
}

function showContextMenuForSnippet(e, snippet) {
	platform.showContextMenu(e, app, [
		{
			label: "%Delete",
			
			onClick() {
				base.stores.snippets.delete(snippet.id);
			},
		},
	]);
}

onMount(function() {
	let teardown = [
		base.stores.snippets.on("create", updateSnippetGroups),
		base.stores.snippets.on("update", updateSnippetGroups),
		base.stores.snippets.on("delete", updateSnippetGroups),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
@use "utils";

#main {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
}

#title {
	padding: 5px;
}

#list {
	position: relative;
	flex-grow: 1;
}

#scroll {
	@include utils.abs-sticky;
	
	--scrollbarBackground: var(--appBackground);
	
	overflow: auto;
	
	&:not(:hover)::-webkit-scrollbar-thumb {
		display: none;
	}
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
	background: var(--dirEntryFolderBackground);
}

.fileIcon {
	background: var(--dirEntryFileBackground);
}
</style>

<div id="main">
	<div id="title">
		Snippets
	</div>
	<Gap height={6}/>
	<div id="list">
		<div id="scroll">
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
							onclick={() => editSnippet(snippet.id)}
							oncontextmenu={(e) => showContextMenuForSnippet(e, snippet)}
						>
							<div class="icon fileIcon"></div>
							<div class="name">
								{snippet.name}
							</div>
						</div>
					{/each}
					<div
						class="entry snippet"
						onclick={() => newSnippetInList(snippets)}
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
				onclick={() => newSnippet()}
			>
				<div class="icon fileIcon"></div>
				<div class="name">
					New
				</div>
			</div>
		</div>
	</div>
</div>
