<script>
import {onMount, getContext, tick} from "svelte";
import FindAndReplace from "components/FindAndReplace.svelte";

let app = getContext("app");

let {findAndReplace} = app;

let showing = app.showingFindAndReplace;
let options;
let {history} = findAndReplace;

async function onShow(_options) {
	showing = false;
	
	await tick();
	
	showing = true;
	options = _options;
}

function onHide() {
	showing = false;
}

function onDone({detail: results}) {
	if (results.length > 0) {
		app.hideFindAndReplace();
	}
}

function onClose() {
	app.hideFindAndReplace();
}

function onHistoryUpdated() {
	({history} = findAndReplace);
}

onMount(function() {
	let teardown = [
		app.on("showFindAndReplace", onShow),
		app.on("hideFindAndReplace", onHide),
		findAndReplace.on("historyUpdated", onHistoryUpdated),
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
	border-top: var(--appBorder);
}
</style>

{#if showing}
	<div id="main">
		<FindAndReplace
			{options}
			{history}
			on:done={onDone}
			on:close={onClose}
		/>
	</div>
{/if}
