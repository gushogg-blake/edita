<script lang="ts">
import {onMount} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import ResizeHandle from "./ResizeHandle.svelte";

let {
	pane,
	children,
} = $props();

let {position, visible, size} = $state(pane);

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

let style = $derived({
	[sizeProp]: size,
	["border-" + borderAndResizeHandlePosition]: "var(--appBorder)",
});

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
@use "utils";

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
	{@render children?.()}
	<ResizeHandle
		position={borderAndResizeHandlePosition}
		onresize={({detail: diff}) => pane.resize(diff)}
		onresizeEnd={({detail: diff}) => pane.resizeAndSave(diff)}
	/>
</div>
