<script>
import {createEventDispatcher, tick} from "svelte";
import inlineStyle from "../utils/dom/inlineStyle";
import sleep from "../utils/sleep";

export let orientation;

let totalSize = 1;
let pageSize = 1;
let maxExpanderPages = 20; // thumb can get too small with many pages otherwise

export function update(totalSize, pageSize, position) {
	_update(totalSize, pageSize, position);
}

let fire = createEventDispatcher();

let main;
let expander;
let settingScrollPosition;
let resetTimer;

let cssSizeKey = {
	horizontal: "width",
	vertical: "height",
};

let scrollSizeKey = {
	horizontal: "scrollWidth",
	vertical: "scrollHeight",
};

let scrollPositionKey = {
	horizontal: "scrollLeft",
	vertical: "scrollTop",
};

let offsetSizeKey = {
	horizontal: "offsetWidth",
	vertical: "offsetHeight",
};

function setScrollPosition(position) {
	settingScrollPosition = true;
	
	let divSize = main[offsetSizeKey[orientation]];
	let scrollSize = main[scrollSizeKey[orientation]];
	let max = scrollSize - divSize;
	
	main[scrollPositionKey[orientation]] = position * max;
	
	if (resetTimer) {
		clearTimeout(resetTimer);
	}
	
	resetTimer = setTimeout(function() {
		settingScrollPosition = false;
	}, 150);
}

function scroll() {
	if (settingScrollPosition) {
		return;
	}
	
	let divSize = main[offsetSizeKey[orientation]];
	let position = main[scrollPositionKey[orientation]];
	let scrollSize = main[scrollSizeKey[orientation]];
	let max = scrollSize - divSize;
	
	if (divSize === 0 || scrollSize === 0) {
		return;
	}
	
	fire("scroll", position / max);
}

function _update(_totalSize, _pageSize, position) {
	totalSize = _totalSize;
	pageSize = _pageSize;
	
	let pages = Math.min(totalSize / pageSize, maxExpanderPages);
	
	expander.style[cssSizeKey[orientation]] = pages * 100 + "%";
	
	setScrollPosition(position);
}
</script>

<style type="text/scss">
#main {
	position: absolute;
	
	&.vertical {
		top: 0;
		right: 0;
		bottom: 0;
		width: 50px;
		overflow-y: scroll;
		overflow-x: hidden;
	}
	
	&.horizontal {
		right: 0;
		bottom: 0;
		left: 0;
		height: 50px;
		overflow-x: scroll;
		overflow-y: hidden;
	}
	
	&::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}
	
	&::-webkit-scrollbar-track {
		/*border-radius: 10px;*/
	}
	
	&::-webkit-scrollbar-thumb {
		width: 8px;
		height: 8px;
		border-radius: 8px;
		border: 2px solid white;
		background-clip: content-box;
		background: #B2B2B2;
	}
}

#expander {
	.vertical & {
		width: 100%;
	}
	
	.horizontal & {
		height: 50px;
	}
}
</style>

<div
	id="main"
	bind:this={main}
	class={orientation}
	on:scroll={scroll}
>
	<div
		id="expander"
		bind:this={expander}
	></div>
</div>
