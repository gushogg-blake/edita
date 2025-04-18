<script lang="ts">
import {onMount, tick} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import type {RefactorPreview} from "ui/refactor";
import type {AstHint} from "ui/AstHint";
import Gap from "components/utils/Gap.svelte";
import Editor from "components/Editor/Editor.svelte";

type Props = {
	refactorPreview: RefactorPreview;
};

let {
	refactorPreview,
} = $props();

let paths = $state(refactorPreview.paths);
let selectedFile = $state(refactorPreview.selectedFile);

let astHintDiv: HTMLDivElement = $state();

let astHint: AstHint = $state();

function onSelectPath() {
	({selectedFile} = refactorPreview);
}

function onUpdatePaths() {
	({paths} = refactorPreview);
}

async function onShowAstHint(hint: AstHint) {
	astHint = hint;
	
	await tick();
	
	astHintDiv.scroll({top: astHintDiv.scrollHeight});
}

function wrapperStyle(level) {
	return inlineStyle({
		paddingLeft: 8 * level,
	});
}

onMount(function() {
	let teardown = [
		refactorPreview.on("updatePaths", onUpdatePaths),
		refactorPreview.on("selectPath", onSelectPath),
		refactorPreview.on("showAstHint", onShowAstHint),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
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
	padding: 5px;
	overflow: hidden;
}

#editors {
	display: grid;
	grid-template-columns: 1fr 1fr;
}

#left {
	display: grid;
	grid-template-rows: 1fr auto;
	border-right: var(--appBorderMedium);
}

#astHint {
	height: 6em;
	border-top: var(--appBorderMedium);
	padding: 5px;
	overflow-y: auto;
	
	.wrapper {
		
	}
	
	#tip {
		font-style: italic;
		opacity: .8;
	}
}
</style>

<div id="main">
	<div id="controls">
		{#if paths.length > 0}
			<div>
				<select
					class="compact"
					onchange={(e) => refactorPreview.selectPath((e.target as HTMLSelectElement).value)}
					value={selectedFile?.path}
				>
					{#each paths as path}
						<option value={path}>{platform.fs(path).homePath}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>
	<div id="editors">
		<div id="left">
			<div>
				<Editor editor={refactorPreview.editors.results}/>
			</div>
			<div bind:this={astHintDiv} id="astHint">
				{#if astHint?.all.length > 0}
					{#if astHint.notOnLine.length > 0}
						{#each astHint.notOnLine as node, i}
							<div class="wrapper" style={wrapperStyle(i)}>
								{#if i === astHint.notOnLine.length - 1 && astHint.onLine.length === 0}
									<b>{node.type}</b>
								{:else}
									{node.type}
								{/if}
							</div>
						{/each}
						<Gap height={8}/>
					{/if}
					
					{#if astHint.onLine.length > 0}
						{#if astHint.notOnLine.length > 0}
							->
						{/if}
						
						{astHint.onLine.slice(0, -1).map(n => n.type).join(" -> ")}
						
						{#if astHint.onLine.length > 1}
							->
						{/if}
						
						<b>{astHint.onLine.at(-1).type}</b>
					{/if}
				{:else}
					<span id="tip">Place the cursor to show Tree-sitter node names</span>
				{/if}
			</div>
		</div>
		<div>
			<Editor editor={refactorPreview.editors.preview}/>
		</div>
	</div>
</div>
