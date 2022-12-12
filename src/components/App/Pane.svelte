<script>
import {onMount} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import ResizeHandle from "./ResizeHandle.svelte";

export let pane;

let {position, visible, size} = pane;

let borderAndResizeHandlePosition = {
	left: "right",
	right: "left",
	bottom: "top",
}[position];

let sizeProp = {
	left: "width",
	right: "width",
	bottom: "height",
}[position];

function onUpdate() {
	({visible, size} = pane);
}

$: style = {
	[sizeProp]: size,
	["border-" + borderAndResizeHandlePosition]: "var(--appBorder)",
};

onMount(function() {
	let teardown = [
		pane.on("update", onUpdate),
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

#main {
	position: relative;
	height: 100%;
}
</style>

<div
	id="main"
	class:hide={!visible}
	style={inlineStyle(style)}
>
	<slot/>
	<ResizeHandle
		position={borderAndResizeHandlePosition}
		on:resize={({detail: diff}) => pane.resize(diff)}
		on:resizeEnd={({detail: diff}) => pane.resizeAndSave(diff)}
	/>
</div>
