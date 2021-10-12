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

let thumbContainer;
let totalSize = 1;
let pageSize = 1;
let position = 0;
let containerSize = 0;
let thumbSize = 0;
let thumbRange = 0;
let thumbOffset = 0;
let startThumbOffset;

let startEvent;

let cssSizeKey = {
	horizontal: "width",
	vertical: "height",
};

let offsetSizeKey = {
	horizontal: "offsetWidth",
	vertical: "offsetHeight",
};

let cssPositionKey = {
	horizontal: "left",
	vertical: "top",
};

let eventKey = {
	horizontal: "clientX",
	vertical: "clientY",
};

function updateContainerSize() {
	containerSize = thumbContainer[offsetSizeKey[orientation]];
}

function updateThumbSize() {
	thumbSize = Math.max(minThumbSize, Math.round(containerSize * pageSize / totalSize));
}

function updateThumbRange() {
	thumbRange = containerSize - thumbSize;
}

function updateThumbOffset() {
	thumbOffset = Math.floor(position * thumbRange);
}

function mousedown(e) {
	startEvent = e;
	startThumbOffset = thumbOffset;
	
	on(window, "mouseup", mouseup);
	on(window, "mousemove", mousemove);
}

function mousemove(e) {
	let diff = e[eventKey[orientation]] - startEvent[eventKey[orientation]];
	let newThumbOffset = startThumbOffset + diff;
	
	newThumbOffset = Math.max(0, newThumbOffset);
	newThumbOffset = Math.min(newThumbOffset, thumbRange);
	
	thumbOffset = newThumbOffset;
	
	fire("scroll", thumbOffset / thumbRange);
}

function mouseup() {
	off(window, "mouseup", mouseup);
	off(window, "mousemove", mousemove);
}

function _update(_totalSize, _pageSize, _position) {
	totalSize = _totalSize;
	pageSize = _pageSize;
	position = _position;
	
	updateContainerSize();
	updateThumbSize();
	updateThumbRange();
	updateThumbOffset();
}

$: thumbStyle = {
	[cssSizeKey[orientation]]: thumbSize,
	[cssPositionKey[orientation]]: thumbOffset,
	visibility: thumbSize === containerSize ? "hidden" : "visible",
};

onMount(function() {
	updateThumbSize();
	updateThumbRange();
});
</script>

<style type="text/scss">
#main {
	padding: var(--scrollbarPadding);
	
	&.vertical {
		height: 100%;
	}
	
	&.horizontal {
		width: 100%;
	}
}

#thumbContainer {
	position: relative;
	
	.vertical & {
		width: var(--scrollbarThumbWidth);
		height: 100%;
	}
	
	.horizontal & {
		width: 100%;
		height: var(--scrollbarThumbWidth);
	}
}

#thumb {
	position: absolute;
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
