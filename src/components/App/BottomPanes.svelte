<script>
import {onMount, getContext} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import TabPane from "./TabPane.svelte";

let app = getContext("app");

let {bottomPanes} = app;
let {tools, output, top, bottom} = bottomPanes;

let main;
let toolsComponent;
let outputComponent;

function update() {
	let {containerHeight} = bottomPanes;
	
	main.style = inlineStyle({
		height: containerHeight,
	});
	
	toolsComponent.update();
	outputComponent.update();
}

function onToolsResize({detail: diff}) {
	bottomPanes.resizeTools(diff);
}

function onToolsResizeEnd({detail: diff}) {
	bottomPanes.resizeAndSaveTools(diff);
}

function onOutputResize({detail: diff}) {
	bottomPanes.resizeOutput(diff);
}

function onOutputResizeEnd({detail: diff}) {
	bottomPanes.resizeAndSaveOutput(diff);
}

onMount(function() {
	let teardown = [
		bottomPanes.on("update", update),
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
	display: flex;
	flex-direction: column;
}
</style>

<div bind:this={main} id="main">
	<TabPane
		bind:this={toolsComponent}
		pane={tools}
		state={top}
		on:resize={onToolsResize}
		on:resizeEnd={onToolsResizeEnd}
	/>
	<TabPane
		bind:this={outputComponent}
		pane={output}
		state={bottom}
		on:resize={onOutputResize}
		on:resizeEnd={onOutputResizeEnd}
	/>
</div>
