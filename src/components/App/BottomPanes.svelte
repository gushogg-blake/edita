<script>
import {onMount, getContext} from "svelte";
import TabPane from "./TabPane.svelte";

let app = getContext("app");

let {bottomPanes} = app;

let main;
let toolsComponent;
let outputComponent;

function update() {
	let {bottom1, bottom2} = app.panes;
	
	inlineStyle.assign(main, {
		height: 
	});
}

function onToolsResize({detail: diff}) {
	console.log(diff);
}

function onToolsResizeEnd({detail: diff}) {
	console.log(diff);
}

function onOutputResize({detail: diff}) {
	console.log(diff);
}

function onOutputResizeEnd({detail: diff}) {
	console.log(diff);
}

onMount(function() {
	let teardown = [
		bottomPanes.on("update", update),
	];
	
	bottomPanes.uiMounted();
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">

</style>

<div bind:this={main} id="main">
	<TabPane
		bind:this={toolsComponent}
		pane={app.panes.tools}
		on:resize={onToolsResize}
		on:resizeEnd={onToolsResizeEnd}
	/>
	<TabPane
		bind:this={outputComponent}
		pane={app.panes.output}
		on:resize={onOutputResize}
		on:resizeEnd={onOutputResizeEnd}
	/>
</div>
