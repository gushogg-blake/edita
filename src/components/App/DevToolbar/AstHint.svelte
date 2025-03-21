<script lang="ts">
import {onMount, tick, getContext} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import Gap from "components/utils/Gap.svelte";

let app = getContext("app");

let {dev} = app;

let refs = $state({});
let astHint = $state();

async function onShowAstHint(hint) {
	astHint = hint;
	
	await tick();
	
	refs.main.scroll({top: refs.main.scrollHeight});
}

function wrapperStyle(level) {
	return inlineStyle({
		paddingLeft: 8 * level,
	});
}

onMount(function() {
	let teardown = [
		dev.on("showAstHint", onShowAstHint),
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

<div bind:this={refs.main} id="main">
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
