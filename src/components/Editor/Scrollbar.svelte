<script lang="ts">
import {onMount, tick} from "svelte";
import {on, off} from "utils/dom/domEvents";
import inlineStyle from "utils/dom/inlineStyle";
import sleep from "utils/sleep";

let {
	orientation,
	onscroll = () => {},
} = $props();

export function update(totalSize, pageSize, position) {
	_update(totalSize, pageSize, position);
}

let minThumbSize = 50;

let totalSize = 1;
let pageSize = 1;
let position = 0;

let thumbContainer = $state();

let containerSize = $state(0);
let thumbSize = $state(0);
let thumbRange = 0;
let thumbOffset = $state(0);

let startThumbOffset;
let startEvent;

let overlay; // to prevent hover effects on other elements while scrolling

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
	
	overlay = document.createElement("div");
	
	overlay.style = inlineStyle({
		position: "fixed",
		zIndex: 100,
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	});
	
	document.body.appendChild(overlay);
	
	on(window, "mouseup", mouseup);
	on(window, "mousemove", mousemove);
}

function mousemove(e) {
	requestAnimationFrame(function() {
		let diff = e[eventKey] - startEvent[eventKey];
		let newThumbOffset = startThumbOffset + diff;
		
		newThumbOffset = Math.max(0, newThumbOffset);
		newThumbOffset = Math.min(newThumbOffset, thumbRange);
		
		thumbOffset = newThumbOffset;
		position = thumbOffset / thumbRange;
		
		onscroll(position);
	});
}

function mouseup() {
	document.body.removeChild(overlay);
	
	off(window, "mouseup", mouseup);
	off(window, "mousemove", mousemove);
}

function _update(_totalSize, _pageSize, _position) {
	totalSize = _totalSize;
	pageSize = _pageSize;
	position = _position;
	
	updateSizes();
}

let thumbStyle = $derived({
	[cssSizeKey]: thumbSize,
	[cssPositionKey]: thumbOffset,
	visibility: thumbSize === containerSize ? "hidden" : "visible",
});

onMount(function() {
	updateSizes();
});
</script>

<style lang="scss">
#main {
	background: var(--scrollbarBackground);
	
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
		width: var(--scrollbarWidth);
	}
	
	.horizontal & {
		height: var(--scrollbarWidth);
	}
}
</style>

<div id="main" class={orientation}>
	<div bind:this={thumbContainer} id="thumbContainer">
		<div
			id="thumb"
			style={inlineStyle(thumbStyle)}
			onmousedown={mousedown}
		></div>
	</div>
</div>
