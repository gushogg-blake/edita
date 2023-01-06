<script>
import {onMount, getContext, createEventDispatcher} from "svelte";
import Editor from "components/Editor/Editor.svelte";
import NodePathTooltip from "./NodePathTooltip.svelte";

export let refactor;

let fire = createEventDispatcher();

let app = getContext("app");

let tooltipComponents = {
	nodePath: NodePathTooltip,
};

let {paths} = refactor;

function onUpdatePaths() {
	({paths} = refactor);
}

function onSelectPath(e) {
	refactor.selectPath(e.target.value);
}

function onRequestTooltipComponent(type, callback) {
	callback(tooltipComponents[type]);
}

onMount(function() {
	let teardown = [
		refactor.on("updatePaths", onUpdatePaths),
		refactor.on("requestTooltipComponent", onRequestTooltipComponent),
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
	
}

</style>

<div id="main">
	<div id="controls">
		<select on:change={onSelectPath}>
			{#each paths as path}
				<option value={path}>{path}</option>
			{/each}
		</select>
	</div>
	<div id="editors">
		<div>
			
		</div>
		<div>
			
		</div>
	</div>
</div>
