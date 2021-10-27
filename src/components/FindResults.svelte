<script>
import {onMount, getContext} from "svelte";
import replaceHomeDirWithTilde from "utils/replaceHomeDirWithTilde";
import inlineStyle from "utils/dom/inlineStyle";
import Spacer from "components/utils/Spacer.svelte";

let app = getContext("app");

let {findResults} = app.bottomPane;

let {
	index,
	currentResults: results,
} = findResults;

function update() {
	({
		index,
		currentResults: results,
	} = findResults);
}

function clickResult(result) {
	findResults.goToResult(result);
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

<style type="text/scss">
@import "mixins/abs-sticky";

#main {
	display: grid;
	grid-template-rows: 1fr;
	height: 100%;
}

#results {
	position: relative;
}

#scroll {
	@include abs-sticky;
	
	overflow-y: auto;
}

.result {
	display: grid;
	/*display: flex;*/
	cursor: pointer;
	
	&:hover {
		.path, .lineNumber {
			text-decoration: underline;
		}
	}
	
	> div {
		padding: 3px;
	}
}
</style>

<div id="main">
	<!--<div>-->
	<!--	File-->
	<!--</div>-->
	<!--<div>-->
	<!--	Line-->
	<!--</div>-->
	<!--<div>-->
	<!--	Match-->
	<!--</div>-->
	<div id="results">
		<div id="scroll">
			{#if results}
				{#each results as result}
					<div
						class="result"
						style={inlineStyle(columnWidths)}
						on:click={() => clickResult(result)}
					>
						<div class="path">
							{replaceHomeDirWithTilde(result.document.path)}
						</div>
						<div class="lineNumber">
							{result.selection.start.lineIndex + 1}
						</div>
						<div>
							{result.replacedLine ? result.replacedLine.trimmed : result.document.lines[result.selection.start.lineIndex].trimmed}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
