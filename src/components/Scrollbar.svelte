<script>
import inlineStyle from "../utils/dom/inlineStyle";

export let orientation;
export let totalSize;
export let pageSize;
export let position;

let dimensions = {
	horizontal: "width",
	vertical: "height",
};

function scroll(e) {
	console.log(e);
}

$: style = calculateStyle(totalSize, pageSize);
$: expanderStyle = calculateExpanderStyle(totalSize, pageSize);

function calculateStyle(totalSize, pageSize) {
	
}

function calculateExpanderStyle(totalSize, pageSize) {
	// return width or height as a percentage (>= 100%) to give the main div a scrollbar
	
	let dimension = dimensions[orientation];
	
	return {
		[dimension]: "150%",
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
}

#expander {
	position: relative;
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
	class={orientation}
	on:scroll={scroll}
	style={inlineStyle(style)}
>
	<div
		id="expander"
		style={inlineStyle(expanderStyle)}
	></div>
</div>
