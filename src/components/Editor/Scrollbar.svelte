<script>
import {onMount, createEventDispatcher, tick} from "svelte";
import {on, off} from "utils/dom/domEvents";
import inlineStyle from "utils/dom/inlineStyle";
import sleep from "utils/sleep";

export let orientation;

export function update(totalSize, pageSize, position) {
	_update(totalSize, pageSize, position);
}

let fire = createEventDispatcher();

let minThumbSize = 50;

let totalSize = 1;
let pageSize = 1;
let position = 0;

let thumbContainer;

let containerSize = 0;
let thumbSize = 0;
let thumbRange = 0;
let thumbOffset = 0;

let startThumbOffset;
let startEvent;

function key(horizontal, vertical) {
	return {horizontal, vertical}[orientation];
}

let cssSizeKey = key("width", "height");
let offsetSizeKey = key("offsetWidth", "offsetHeight");
let cssPositionKey = key("left", "top");
let eventKey = key("clientX", "clientY");

function updateSizes() {
	containerSize = thumbContainer[offsetSizeKey];
	thumbSize = Math.max(minThumbSize, Math.round(containerSize * pageSize / totalSize));
	thumbRange = containerSize - thumbSize;
	thumbOffset = Math.floor(position * thumbRange);
}

function mousedown(e) {
	startEvent = e;
	startThumbOffset = thumbOffset;
	
	on(window, "mouseup", mouseup);
	on(window, "mousemove", mousemove);
}

function mousemove(e) {
	let diff = e[eventKey] - startEvent[eventKey];
	let newThumbOffset = startThumbOffset + diff;
	
	newThumbOffset = Math.max(0, newThumbOffset);
	newThumbOffset = Math.min(newThumbOffset, thumbRange);
	
	thumbOffset = newThumbOffset;
	position = thumbOffset / thumbRange;
	
	fire("scroll", position);
}

function mouseup() {
	off(window, "mouseup", mouseup);
	off(window, "mousemove", mousemove);
}

function _update(_totalSize, _pageSize, _position) {
	totalSize = _totalSize;
	pageSize = _pageSize;
	position = _position;
	
	updateSizes();
}

$: thumbStyle = {
	[cssSizeKey]: thumbSize,
	[cssPositionKey]: thumbOffset,
	visibility: thumbSize === containerSize ? "hidden" : "visible",
};

onMount(function() {
	updateSizes();
});
</script>

<style type="text/scss">
#main {
	&.vertical {
		height: 100%;
	}
	
	&.horizontal {
		width: 100%;
	}
}

#thumbContainer {
	position: relative;
	overflow: hidden;
	
	.vertical & {
		width: var(--scrollbarWidth);
		height: 100%;
	}
	
	.horizontal & {
		width: 100%;
		height: var(--scrollbarWidth);
	}
}

#thumb {
	position: absolute;
	border: var(--scrollbarThumbBorder);
	border-radius: 8px;
	background: var(--scrollbarThumbBackground);
	
	.vertical & {
		width: 100%;
	}
	
	.horizontal & {
		height: 100%;
	}
}

</style>

<div id="main" class={orientation}>
	<div bind:this={thumbContainer} id="thumbContainer">
		<div
			id="thumb"
			style={inlineStyle(thumbStyle)}
			on:mousedown={mousedown}
		></div>
	</div>
</div>
