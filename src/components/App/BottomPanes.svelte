<script lang="ts">
import {onMount, getContext} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import TabPane from "./TabPane.svelte";

let app = getContext("app");

let {bottomPanes} = app;
let {tools, output, top, bottom, containerHeight} = $state(bottomPanes);

function update() {
	({containerHeight} = bottomPanes);
}

function onToolsResize(diff) {
	bottomPanes.resizeTools(diff);
}

function onToolsResizeEnd(diff) {
	bottomPanes.resizeAndSaveTools(diff);
}

function onOutputResize(diff) {
	bottomPanes.resizeOutput(diff);
}

function onOutputResizeEnd(diff) {
	bottomPanes.resizeAndSaveOutput(diff);
}

let mainStyle = $derived({
	height: containerHeight,
});

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

<div id="main" style={inlineStyle(mainStyle)}>
	<TabPane
		pane={tools}
		_state={top}
		onresize={onToolsResize}
		onresizeEnd={onToolsResizeEnd}
	/>
	<TabPane
		pane={output}
		_state={bottom}
		onresize={onOutputResize}
		onresizeEnd={onOutputResizeEnd}
	/>
</div>
