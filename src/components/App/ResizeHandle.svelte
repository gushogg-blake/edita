<script>
import {createEventDispatcher} from "svelte";
import {on, off} from "utils/dom/domEvents";

export let position;
export let getSize;

let fire = createEventDispatcher();

let eventKey = {
	horizontal: "clientX",
	vertical: "clientY",
};

let reverseKey = {
	left: 1,
	right: -1,
	top: 1,
	bottom: -1,
};

let orientation = position === "left" || position === "right" ? "horizontal" : "vertical";
let size;
let startPoint;

function getDiff(e) {
	let point = e[eventKey[orientation]];
	
	return (point - startPoint) * reverseKey[position];
}

function mousedown(e) {
	size = getSize();
	startPoint = e[eventKey[orientation]];
	
	on(window, "mousemove", mousemove);
	on(window, "mouseup", mouseup);
}

function mousemove(e) {
	fire("resize", size + getDiff(e));
}

function mouseup(e) {
	fire("end", size + getDiff(e));
	
	off(window, "mousemove", mousemove);
	off(window, "mouseup", mouseup);
}
</script>

<style lang="scss">
#main {
	--size: 4px;
	
	position: absolute;
	
	&.left, &.right {
		top: 0;
		bottom: 0;
		width: var(--size);
		cursor: ew-resize;
	}
	
	&.top, &.bottom {
		left: 0;
		right: 0;
		height: var(--size);
		cursor: ns-resize;
	}
	
	&.left {
		right: 0;
	}
	
	&.right {
		left: 0;
	}
	
	&.top {
		bottom: 0;
	}
	
	&.bottom {
		top: 0;
	}
}
</style>

<div
	id="main"
	class={position}
	on:mousedown={mousedown}
></div>
