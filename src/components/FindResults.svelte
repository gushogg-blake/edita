<script lang="ts">
import {onMount} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import {getApp} from "components/context";
import Spacer from "components/utils/Spacer.svelte";

let {
	findResults,
} = $props();

let app = getApp();

let index = $state(findResults.index);
let pages = $state(findResults.pages);
let currentPage = $state(findResults.currentPage);

function update() {
	({
		index,
		pages,
		currentPage,
	} = findResults);
}

let columnWidths = $derived({
	gridTemplateColumns: "400px 100px auto",
});

function onPageChange(e) {
	let el = e.target as HTMLSelectElement;
	let page = Number(el.value);
	
	findResults.goToPage(page);
}

onMount(function() {
	let teardown = [
		findResults.on("resultsAdded", update),
		findResults.on("nav", update),
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
	height: 100%;
	background: var(--outputBackground);
}

#nav {
	--buttonBorder: 0;
	--buttonBackground: transparent;
	
	border-bottom: var(--appBorderMedium);
	padding: 3px;
	background: var(--toolbarBackground);
}

#results {
	position: relative;
	flex-grow: 1;
}

#scroll {
	@include utils.abs-sticky;
	
	overflow-y: auto;
}

.result {
	display: grid;
	cursor: pointer;
	
	&:hover {
		.file, .lineNumber {
			text-decoration: underline;
		}
	}
	
	> div {
		padding: 3px;
	}
}

.file {
	display: flex;
	
	.path {
		@include utils.ellipsis;
	}
	
	.name {
		flex-shrink: 0;
	}
}
</style>

<div id="main">
	{#if pages.length > 0}
		<div id="nav">
			<select class="compact" value={index} onchange={onPageChange}>
				{#each pages as {options, results}, i}
					<option value={i}>{options.search} ({results.length} results)</option>
				{/each}
			</select>
			&nbsp;
			<button onclick={() => findResults.rerun()}>
				Rerun
			</button>
			<button onclick={() => findResults.edit()}>
				Edit
			</button>
		</div>
	{/if}
	{#each pages as {results}, i}
		<div id="results" class:hide={index !== i}>
			<div id="scroll">
				{#each results as result}
					<div
						class="result"
						style={inlineStyle(columnWidths)}
						onclick={() => findResults.goToResult(result)}
					>
						<div class="file">
							<div class="path">
								{platform.fs(result.document.path).parent.homePath}
							</div>
							<div class="name">
								{platform.fs(result.document.path).parent.isRoot ? "" : platform.systemInfo.pathSeparator}{platform.fs(result.document.path).name}
							</div>
						</div>
						<div class="lineNumber">
							{result.selection.start.lineIndex + 1}
						</div>
						<div>
							{result.replacedLine ? result.replacedLine.trimmed : result.document.lines[result.selection.start.lineIndex].trimmed}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
