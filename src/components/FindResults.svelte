<script>
import {onMount, getContext} from "svelte";
import replaceHomeDirWithTilde from "utils/replaceHomeDirWithTilde";
import inlineStyle from "utils/dom/inlineStyle";
import Spacer from "components/utils/Spacer.svelte";

let app = getContext("app");

let {findResults} = app.bottomPane;

let {
	index,
	pages,
	currentPage,
} = findResults;

function update() {
	({
		index,
		pages,
		currentPage,
	} = findResults);
}

$: columnWidths = {
	gridTemplateColumns: "400px 100px auto",
};

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
@import "classes/hide";
@import "mixins/abs-sticky";
@import "mixins/ellipsis";

#main {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: var(--findResultsBackground);
}

#nav {
	--buttonBorder: 0;
	--buttonBackground: transparent;
	
	//border-top: var(--appBorder);
	//border-bottom: var(--appBorderMedium);
	padding: 3px;
	//background: var(--toolbarBackground);
}

#results {
	position: relative;
	flex-grow: 1;
}

#scroll {
	@include abs-sticky;
	
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
		@include ellipsis;
	}
	
	.name {
		flex-shrink: 0;
	}
}
</style>

<div id="main">
	{#if pages.length > 0}
		<div id="nav">
			<select class="compact" value={index} on:change={(e) => findResults.goToPage(Number(e.target.value))}>
				{#each pages as {options, results}, i}
					<option value={i}>{options.search} ({results.length} results)</option>
				{/each}
			</select>
			&nbsp;
			<button on:click={() => findResults.rerun()}>
				Rerun
			</button>
			<button on:click={() => findResults.edit()}>
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
						on:click={() => findResults.goToResult(result)}
					>
						<div class="file">
							<div class="path">
								{replaceHomeDirWithTilde(platform.fs(result.document.path).parent.path)}
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
