<script>
import {onMount, getContext} from "svelte";
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
	
	console.log(results);
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

<style type="text/scss">
.result {
	display: flex;
}
</style>

<div id="main">
	{#if results}
		{#each results as result}
			<div class="result">
				<div>
					{result.match}
				</div>
				<Spacer/>
				<div>
					{result.document.path}
				</div>
			</div>
		{/each}
	{/if}
</div>
