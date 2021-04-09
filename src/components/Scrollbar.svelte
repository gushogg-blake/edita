<script>
import {createEventDispatcher} from "svelte";
import inlineStyle from "../utils/dom/inlineStyle";

export let orientation;

let totalSize = 1;
let pageSize = 1;
let position = 0;

export function setRange(totalSize, pageSize) {
	_setRange(totalSize, pageSize);
}

export function setPosition(position) {
	_setPosition(position);
}

let fire = createEventDispatcher();

let main;

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

function getScrollPosition() {
	let divSize = main[offsetSizeKey[orientation]];
	let position = main[scrollPositionKey[orientation]];
	let scrollSize = main[scrollSizeKey[orientation]];
	let max = scrollSize - divSize;
	
	return position / max;
}

function scroll() {
	fire("scroll", getScrollPosition());
}

function _setRange(_totalSize, _pageSize) {
	
}

function _setPosition(_position) {
}

//$: style = calculateStyle(totalSize, pageSize);
$: expanderStyle = calculateExpanderStyle(totalSize, pageSize);

//function calculateStyle(totalSize, pageSize) {
//	
//}

function calculateExpanderStyle(totalSize, pageSize) {
	// return width or height as a percentage (>= 100%) to give the main div a scrollbar
	
	return {
		[cssSizeKey[orientation]]: "150%",
	};
}


</script>

<style type="text/scss">
@import "../css/mixins/abs-sticky";

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
		style={inlineStyle(expanderStyle)}
	></div>
</div>
