<script>
import {createEventDispatcher} from "svelte";
import inlineStyle from "../../utils/dom/inlineStyle";

export let overallWidth;
export let marginWidth;
export let marginOffset;
export let mode;

let fire = createEventDispatcher();

function mousedown(e) {
	fire("mousedown", e);
}

function mousemove(e) {
	fire("mousemove", e);
}

function mouseup(e) {
	fire("mousedown", e);
}

function mouseenter(e) {
	fire("mouseenter", e);
}

function mouseleave(e) {
	fire("mouseleave", e);
}

function dragover(e) {
	fire("dragover", e);
}

function drop(e) {
	fire("drop", e);
}

function calculateMarginStyle(marginWidth) {
	return {
		width: marginWidth,
	};
}

function calculateCodeStyle(overallWidth, marginOffset, mode) {
	return {
		left: marginOffset,
		width: overallWidth - marginOffset,
		cursor: mode === "ast" ? "default" : "text",
	};
}

$: marginStyle = calculateMarginStyle(marginWidth);
$: codeStyle = calculateCodeStyle(overallWidth, marginOffset, mode);
</script>

<style type="text/scss">
@import "../../css/mixins/abs-sticky";

#main {
	@include abs-sticky;
}

#margin {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
}

#code {
	position: absolute;
	top: 0;
	height: 100%;
}
</style>

<div
	id="main"
>
	<div
		id="margin"
		style={inlineStyle(marginStyle)}
	>
		
	</div>
	<div
		id="code"
		style={inlineStyle(codeStyle)}
		on:mousedown={mousedown}
		on:mouseenter={mouseenter}
		on:mouseleave={mouseleave}
		on:mousemove={mousemove}
		on:dragover={dragover}
		on:drop={drop}
	>
		
	</div>
</div>
