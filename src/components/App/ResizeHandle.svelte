<script>
import {createEventDispatcher} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import {on, off} from "utils/dom/domEvents";

export let position;
export let getSize;

let fire = createEventDispatcher();

let orientation = position === "left" || position === "right" ? "vertical" : "horizontal";

let eventKey = {
	horizontal: "clientY",
	vertical: "clientX",
}[orientation];

let dir = {
	left: -1,
	right: 1,
	top: -1,
	bottom: 1,
}[position];

let cursor = {
	horizontal: "ns-resize",
	vertical: "ew-resize",
}[orientation];

let size;
let startPoint;

function getDiff(e) {
	let point = e[eventKey];
	
	return (point - startPoint) * dir;
}

function pointerdown(e) {
	let div = e.target;
	
	div.setPointerCapture(e.pointerId);
	
	size = getSize();
	startPoint = e[eventKey];
	
	on(div, "pointermove", pointermove);
	on(div, "pointerup", pointerup);
}

function pointermove(e) {
	fire("resize", size + getDiff(e));
}

function pointerup(e) {
	let div = e.target;
	
	div.releasePointerCapture(e.pointerId);
	
	fire("end", size + getDiff(e));
	
	off(div, "pointermove", pointermove);
	off(div, "pointerup", pointerup);
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
	}
	
	&.top, &.bottom {
		left: 0;
		right: 0;
		height: var(--size);
	}
	
	&.left {
		left: 0;
	}
	
	&.right {
		right: 0;
	}
	
	&.top {
		top: 0;
	}
	
	&.bottom {
		bottom: 0;
	}
}
</style>

<div
	id="main"
	class={position}
	style={inlineStyle({cursor})}
	on:pointerdown={pointerdown}
></div>
