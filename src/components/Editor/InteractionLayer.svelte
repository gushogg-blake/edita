<script>
import {createEventDispatcher} from "svelte";
import unique from "../../utils/array/unique";
import {on, off} from "../../utils/dom/domEvents";
import inlineStyle from "../../utils/dom/inlineStyle";
import topMargin from "../../modules/render/topMargin";
import drag from "./utils/drag";
import createDragEvent from "./utils/createDragEvent";

export let overallWidth;
export let marginWidth;
export let marginOffset;
export let rowHeight;
export let colWidth;
export let mode;
export let pickOptions;
export let dropTargets;

let codeDiv;
let selectedOption;
let draggable = false;
let useNativeDrag;
let currentDropTarget;
let clickDistanceThreshold = 2;
let mouseMovedDistance;

let fire = createEventDispatcher();

$: pickOptionRows = unique(pickOptions.map(option => option.screenRow));
$: dropTargetRows = unique(dropTargets.map(target => target.screenRow));

let syntheticDrag = drag({
	start(e) {
		codeDiv.dispatchEvent(createDragEvent.dragstart(e));
	},
	
	move(e, x, y) {
		codeDiv.dispatchEvent(createDragEvent.dragover(e));
		
		// dragenter, dragleave, dragover on other els
	},
	
	end(e) {
		// TODO only fire drop if over drop target
		codeDiv.dispatchEvent(new MouseEvent("drop", e));
		codeDiv.dispatchEvent(new MouseEvent("dragend", e));
	},
	
	click(e) {
		fire("click", e);
	},
});

function mousedown(e) {
	mouseMovedDistance = 0;
	
	on(window, "mouseup", mouseup);
	
	fire("mousedown", {
		e,
		option: selectedOption,
		
		enableDrag(useNative) {
			draggable = true;
			useNativeDrag = useNative;
		},
	});
	
	if (!useNativeDrag) {
		syntheticDrag.mousedown(e);
	}
}

function mousemove(e) {
	mouseMovedDistance++;
	
	if (!useNativeDrag) {
		syntheticDrag.mousemove(e);
	}
	
	fire("mousemove", e);
}

function mouseup(e) {
	if (useNativeDrag) {
		if (mouseMovedDistance <= clickDistanceThreshold) {
			fire("click", e);
		}
	} else {
		syntheticDrag.mouseup(e);
	}
	
	selectedOption = null;
	draggable = false;
	useNativeDrag = false;
	
	fire("mouseup", e);
	
	off(window, "mouseup", mouseup);
}

function mouseenter(e) {
	fire("mouseenter", e);
}

function mouseleave(e) {
	fire("mouseleave", e);
}

function dragstart(e) {
	if (selectedOption) {
		let {node, x, y} = selectedOption;
		
		e.dataTransfer.setDragImage(node, x, y);
	} else {
		e.dataTransfer.setDragImage(new Image(), 0, 0);
	}
	
	fire("dragstart", {
		e,
		option: selectedOption,
	});
}

function dragover(e) {
	fire("dragover", {
		e,
		option: selectedOption,
	});
}

function drop(e) {
	draggable = false;
	useNativeDrag = false;
	
	fire("drop", {
		e,
		option: selectedOption,
	});
	
	selectedOption = null;
}

function dragend(e) {
	draggable = false;
	useNativeDrag = false;
	selectedOption = null;
	
	fire("dragend", e);
}

function pickOptionMousedown(option, e) {
	selectedOption = {
		option,
		node: e.target,
		x: e.offsetX,
		y: e.offsetY,
	};
}

function pickOptionMouseenter(option, e) {
	fire("optionhover", {
		option,
		e,
	});
}

function pickOptionMouseleave(option, e) {
	fire("optionhover", {
		option: null,
		e,
	});
}

function calculateMarginStyle(marginWidth) {
	return {
		width: marginWidth,
	};
}

function calculateCodeStyle(overallWidth, marginWidth, mode) {
	return {
		left: marginWidth,
		width: overallWidth - marginWidth,
		cursor: mode === "ast" ? "default" : "text",
	};
}

//function pickOptionRowStyle(screenRow, rowHeight) {
//	return {
//		top: screenRow * rowHeight,
//	};
//}
//
//function dropTargetRowStyle(screenRow, rowHeight) {
//	return {
//		top: screenRow * rowHeight,
//		height: rowHeight,
//	};
//}

function rowStyle(items, screenRow, rowHeight, colWidth) {
	let {screenCol} = items.find(item => item.screenRow === screenRow);
	
	return {
		top: topMargin + screenRow * rowHeight,
		left: screenCol * colWidth,
		height: rowHeight,
	};
}

$: marginStyle = calculateMarginStyle(marginWidth);
$: codeStyle = calculateCodeStyle(overallWidth, marginOffset, mode);

$: console.log(colWidth);
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

.row {
	position: absolute;
	display: flex;
	align-items: center;
	gap: 5px;
}

.option {
	/*font-weight: bold;*/
	font-size: 12px;
	border: 1px solid #544200;
	border-radius: 100px;
	padding: 0 5px;
}

.pickOption {
	color: #3D2F00;
	background: #D6AD0C;
}

.dropTarget {
	color: #EFD2C4;
	background: #A0451E;
	background: #D34F0C;
	
	&.active {
		color: #FCDFD1;
		background: #B24711;
	}
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
		bind:this={codeDiv}
		id="code"
		style={inlineStyle(codeStyle)}
		on:mousedown={mousedown}
		on:mouseenter={mouseenter}
		on:mouseleave={mouseleave}
		on:mousemove={mousemove}
		draggable={draggable && useNativeDrag}
		on:dragstart={dragstart}
		on:dragover={dragover}
		on:drop={drop}
		on:dragend={dragend}
	>
		{#if mode === "ast"}
			{#each pickOptionRows as screenRow}
				<div
					class="row"
					style={inlineStyle(rowStyle(pickOptions, screenRow, rowHeight, colWidth))}
				>
					{#each pickOptions.filter(o => o.screenRow === screenRow) as option}
						<div
							class="option pickOption"
							on:mousedown={(e) => pickOptionMousedown(option, e)}
							on:mouseenter={(e) => pickOptionMouseenter(option, e)}
							on:mouseleave={(e) => pickOptionMouseleave(option, e)}
						>
							{option.label}
						</div>
					{/each}
				</div>
			{/each}
			{#each dropTargetRows as screenRow}
				<div
					class="row"
					style={inlineStyle(rowStyle(dropTargets, screenRow, rowHeight, colWidth))}
				>
					{#each dropTargets.filter(o => o.screenRow === screenRow) as target}
						<div
							class="option dropTarget"
							class:active={target === currentDropTarget}
						>
							{target.label}
						</div>
					{/each}
				</div>
			{/each}
		{/if}
	</div>
</div>
