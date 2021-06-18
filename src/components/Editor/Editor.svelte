<script>
import {tick, onMount} from "svelte";

import sleep from "../../utils/sleep";
import inlineStyle from "../../utils/dom/inlineStyle";
import {on, off} from "../../utils/dom/domEvents";
import screenOffsets from "../../utils/dom/screenOffsets";
import autoScroll from "../../utils/dom/autoScroll";
import windowFocus from "../../utils/dom/windowFocus";
import getKeyCombo from "../../utils/getKeyCombo";
import clipboard from "../../modules/ipc/clipboard/renderer";

import calculateMarginWidth from "../../modules/render/calculateMarginWidth";
import calculateMarginOffset from "../../modules/render/calculateMarginOffset";
import calculateNormalSelectionRegions from "../../modules/render/calculateNormalSelectionRegions";
import render from "../../modules/render/render";
import rowColFromScreenCoords from "../../modules/utils/rowColFromScreenCoords";
import screenCoordsFromRowCol from "../../modules/utils/screenCoordsFromRowCol";
import rowColFromCursor from "../../modules/utils/rowColFromCursor";
import cursorFromRowCol from "../../modules/utils/cursorFromRowCol";
import findFirstVisibleLine from "../../modules/utils/findFirstVisibleLine";
import Selection from "../../modules/utils/Selection";
import AstSelection from "../../modules/utils/AstSelection";

import prefs from "../../stores/prefs";

import Scrollbar from "../Scrollbar.svelte";

import normalMouse from "./normalMouse";
import astMouse from "./astMouse";
import normalKeyboard from "./normalKeyboard";
import astKeyboard from "./astKeyboard";
import modeSwitchKey from "./modeSwitchKey";

import InteractionLayer from "./InteractionLayer.svelte";

export let document;

$: prefsUpdated($prefs);

export function focus() {
	focused = true;
}

export function show() {
	visible = true;
	resize();
	redraw();
}

export function hide() {
	visible = false;
}

let revisionCounter = 0;
let mounted = false;
let canvasDiv;
let measurementsDiv;
let canvas;
let context;
let measurements;
let rowHeightPadding = 2;
let rowBaselineHint = -1;

let sizes = {
	overallWidth: 0,
	marginWidth: 0,
	marginOffset: 0,
};

let verticalScrollbar;
let horizontalScrollbar;
let hasHorizontalScrollbar = !$prefs.wrap;

let visible = true;
let focused = false;
let windowHasFocus;

let mode = "ast";
let isPeekingAstMode = false;
let switchToAstModeOnMouseUp = false;

let normalSelection = {
	start: [0, 0],
	end: [0, 0],
};

let normalSelectionRegions = [];

// for remembering the "intended" col when moving a cursor up/down to a line
// that doesn't have as many cols as the cursor
let selectionEndCol = 0;

let astSelection = [13, 14];
let astSelectionHilite = null;
let astInsertionHilite = null;
let pickOptions = [];
let dropTargets = [];

let showDropTargetsFor = {
	selection: null,
	option: null,
};

let isDragging = false;

let scrollPosition = {
	row: 0,
	x: 0,
};

let hiliteWord = null;

let cursorBlinkOn;
let cursorInterval;

let mouseIsDown = false;
let lastMouseMoveEvent;

let normalMouseHandler = normalMouse({
	get canvas() {
		return canvas;
	},
	
	get measurements() {
		return measurements;
	},
	
	get document() {
		return document;
	},
	
	get hasHorizontalScrollbar() {
		return hasHorizontalScrollbar;
	},
	
	get scrollPosition() {
		return scrollPosition;
	},
	
	get selection() {
		return normalSelection;
	},
	
	get selectionRegions() {
		return normalSelectionRegions;
	},
	
	scrollBy,
	redraw,
	startCursorBlink,
	
	setSelection(selection) {
		setNormalSelection(selection);
		
		let {end} = selection;
		let [lineIndex, offset] = end;
		let [, endCol] = rowColFromCursor(document.lines, lineIndex, offset);
		
		selectionEndCol = endCol;
	},
	
	mouseup() {
		mouseIsDown = false;
		
		if (switchToAstModeOnMouseUp) {
			switchToAstMode();
			redraw();
			
			switchToAstModeOnMouseUp = false;
		}
	},
});

let astMouseHandler = astMouse({
	get canvas() {
		return canvas;
	},
	
	get measurements() {
		return measurements;
	},
	
	get document() {
		return document;
	},
	
	get hasHorizontalScrollbar() {
		return hasHorizontalScrollbar;
	},
	
	get scrollPosition() {
		return scrollPosition;
	},
	
	get selection() {
		return astSelection;
	},
	
	get normalSelection() {
		return normalSelection;
	},
	
	get isPeekingAstMode() {
		return isPeekingAstMode;
	},
	
	setSelection(selection) {
		astSelection = selection;
	},
	
	setSelectionHilite(selection) {
		setAstSelectionHilite(selection);
	},
	
	setInsertionHilite(selection) {
		astInsertionHilite = selection;
	},
	
	showPickOptionsFor,
	
	showDropTargetsFor(selection, option) {
		showDropTargetsFor = {
			selection,
			option,
		};
		
		updateDropTargets();
	},
	
	pick(selection, option) {
		astSelection = selection;
	},
	
	scrollBy,
	redraw,
	
	mouseup() {
		mouseIsDown = false;
	},
});

let normalKeyboardHandler = normalKeyboard({
	get document() {
		return document;
	},
	
	get selection() {
		return normalSelection;
	},
	
	get selectionEndCol() {
		return selectionEndCol;
	},
	
	setSelection(selection) {
		setNormalSelection(selection);
	},
	
	getCodeAreaSize,
	updateSelectionEndCol,
	ensureSelectionIsOnScreen,
	updateScrollbars,
	startCursorBlink,
	redraw,
});

let astKeyboardHandler = astKeyboard({
	get document() {
		return document;
	},
	
	get selection() {
		return astSelection;
	},
	
	get selectionEndCol() {
		return selectionEndCol;
	},
	
	setSelection(selection) {
		astSelection = selection;
		
		setNormalSelection(null);
	},
	
	scrollPageUp,
	scrollPageDown,
	scrollBy,
	switchToNormalMode,
	getCodeAreaSize,
	ensureSelectionIsOnScreen,
	updateScrollbars,
	startCursorBlink,
	redraw,
});


let modeSwitchKeyHandler = modeSwitchKey({
	switchToAstMode(isPeeking) {
		isPeekingAstMode = isPeeking;
		
		if (mouseIsDown) {
			switchToAstModeOnMouseUp = true;
			
			return;
		}
		
		switchToAstMode();
		redraw();
	},
	
	switchToNormalMode() {
		switchToNormalMode();
		redraw();
	},
	
	get mode() {
		return mode;
	},
	
	get minHoldTime() {
		return $prefs.minHoldTime;
	},
});

function mousedown({detail}) {
	let {
		e,
		option,
		enableDrag,
	} = detail;
	
	mouseIsDown = true;
	
	if (mode === "normal") {
		normalMouseHandler.mousedown(e, function() {
			enableDrag(false);
		});
	} else if (mode === "ast") {
		astMouseHandler.mousedown(e, option, function() {
			// if we're holding the Esc key down to peek AST mode, use synthetic
			// drag as native will be canceled by the repeated keydown events
			enableDrag(isPeekingAstMode && $prefs.modeSwitchKey === "Escape");
		});
	}
}

function mousemove({detail: e}) {
	if (isDragging) {
		//console.log("mousemove - dragging");
		return;
	}
	
	//console.log("mousemove");
	
	lastMouseMoveEvent = e;
	
	if (mode === "normal") {
		normalMouseHandler.mousemove(e);
	} else if (mode === "ast") {
		astMouseHandler.mousemove(e);
	}
}

function mouseenter({detail: e}) {
	if (isDragging) {
		return;
	}
	
	if (mode === "normal") {
		normalMouseHandler.mouseenter(e);
	} else if (mode === "ast") {
		astMouseHandler.mouseenter(e);
	}
}

function mouseleave({detail: e}) {
	if (isDragging) {
		return;
	}
	
	if (mode === "normal") {
		normalMouseHandler.mouseleave(e);
	} else if (mode === "ast") {
		astMouseHandler.mouseleave(e);
	}
}

function mouseup({detail: e}) {
	mouseIsDown = false;
}

function click({detail: e}) {
	if (mode === "normal") {
		normalMouseHandler.click(e);
	} else if (mode === "ast") {
		astMouseHandler.click(e);
	}
}

function dblclick(e) {
	if (mode === "normal") {
		normalMouseHandler.dblclick(e);
	} else if (mode === "ast") {
		astMouseHandler.dblclick(e);
	}
}

function optionmousedown({detail}) {
	let {
		e,
		option,
	} = detail;
	
	astMouseHandler.optionmousedown(option, e);
}

function optionhover({detail}) {
	let {
		e,
		option,
	} = detail;
	
	astMouseHandler.optionhover(option, e);
}

function dragstart({detail}) {
	let {
		e,
		option,
	} = detail;
	
	isDragging = true;
	
	if (mode === "normal") {
		normalMouseHandler.dragstart(e);
	} else if (mode === "ast") {
		astMouseHandler.dragstart(e, option);
	}
}

function dragover({detail}) {
	let {
		e,
		target,
	} = detail;
	
	if (mode === "normal") {
		normalMouseHandler.dragover(e);
	} else if (mode === "ast") {
		astMouseHandler.dragover(e, target);
	}
}

function dragend({detail: e}) {
	console.log("dragend", Date.now());
	isDragging = false;
	
	if (mode === "normal") {
		normalMouseHandler.dragend(e);
	} else if (mode === "ast") {
		astMouseHandler.dragend(e);
	}
}

function drop({detail}) {
	let {
		e,
		target,
	} = detail;
	
	if (mode === "normal") {
		normalMouseHandler.drop(e, target);
	} else if (mode === "ast") {
		astMouseHandler.drop(e, target);
	}
}

//function mouseEvent(type, e) {
//	if (mode === "normal") {
//		normalMouseHandler[type](e);
//	} else if (mode === "ast") {
//		astMouseHandler[type](e);
//	}
//}

function wheel(e) {
	let dir = e.deltaY > 0 ? 1 : -1;
	
	if (e.shiftKey) {
		scrollBy(measurements.colWidth * 3 * dir, 0);
	} else {
		scrollBy(0, 3 * dir);
	}
}

function keydown(e) {
	if (!focused) {
		return;
	}
	
	if (e.key === $prefs.modeSwitchKey) {
		e.preventDefault();
		
		modeSwitchKeyHandler.keydown(e);
		
		return;
	}
	
	if (mode === "normal") {
		normalKeyboardHandler.keydown(e);
	} else if (mode === "ast") {
		astKeyboardHandler.keydown(e);
	}
}

function keyup(e) {
	if (!focused) {
		return;
	}
	
	if (e.key === $prefs.modeSwitchKey) {
		e.preventDefault();
		
		modeSwitchKeyHandler.keyup(e);
		
		return;
	}
}

function showPickOptionsFor(selection) {
	if (!selection) {
		return;
	}
	
	let [startLineIndex] = selection;
	let lineIndex = startLineIndex;
	let {lines} = document;
	let {codeIntel} = document.lang;
	
	pickOptions = [{
		lineIndex,
		
		options: codeIntel.generatePickOptions(
			lines,
			selection,
		).map(function(option) {
			return {
				lineIndex,
				option,
			};
		}),
	}];
}

function updateDropTargets() {
	let byLineIndex = new Map();
	
	let {
		selection,
		option,
	} = showDropTargetsFor;
	
	if (!selection) {
		return;
	}
	
	let {lines} = document;
	let {codeIntel} = document.lang;
	let {lineIndex} = findFirstVisibleLine(lines, scrollPosition);
	
	let rowsToRender = canvas.height / measurements.rowHeight;
	let rowsRendered = 0;
	
	while (lineIndex < lines.length) {
		if (AstSelection.lineIsWithinSelection(lineIndex, selection)) {
			lineIndex++;
			
			continue;
		}
		
		let line = lines[lineIndex];
		
		byLineIndex.set(lineIndex, codeIntel.generateDropTargets(
			lines,
			lineIndex,
			selection,
			option,
		).map(function(target) {
			return {
				lineIndex,
				target,
			};
		}));
		
		rowsRendered += line.height;
		
		if (rowsRendered >= rowsToRender) {
			break;
		}
		
		lineIndex++;
	}
	
	dropTargets = [...byLineIndex.entries()].map(function([lineIndex, targets]) {
		return {
			lineIndex,
			targets,
		};
	});
}

function setAstSelectionHilite(selection) {
	astSelectionHilite = selection;
}

function scrollBy(x, rows) {
	if (x !== 0) {
		let newX = Math.round(scrollPosition.x + x);
		
		newX = Math.max(0, newX);
		
		scrollPosition.x = newX;
	}
	
	if (rows !== 0) {
		let newRow = scrollPosition.row + rows;
		
		newRow = Math.max(0, newRow);
		newRow = Math.min(newRow, document.countRows() - 1);
		
		scrollPosition.row = newRow;
	}
	
	updateScrollbars();
	redraw();
}

function scrollPage(dir) {
	let {rows} = getCodeAreaSize();
	
	scrollBy(0, rows * dir);
}

function scrollPageDown() {
	scrollPage(1);
}

function scrollPageUp() {
	scrollPage(-1);
}

function ensureSelectionIsOnScreen() {
	if (mode === "ast") {
		ensureAstSelectionIsOnScreen();
	} else {
		ensureNormalCursorIsOnScreen();
	}
}

function ensureAstSelectionIsOnScreen() {
	
}

function ensureNormalCursorIsOnScreen() {
	let {colWidth} = measurements;
	
	let {end} = normalSelection;
	let [lineIndex, offset] = end;
	let [row, col] = rowColFromCursor(document.lines, lineIndex, offset);
	
	let {width, rows} = getCodeAreaSize();
	let maxRow = document.countRows() - 1;
	let firstVisibleRow = scrollPosition.row;
	let lastFullyVisibleRow = firstVisibleRow + rows;
	
	let idealRowBuffer = 5;
	
	let topRowDiff = idealRowBuffer - (row - firstVisibleRow);
	
	if (topRowDiff > 0) {
		scrollPosition.row = Math.max(0, scrollPosition.row - topRowDiff);
	}
	
	let bottomRowDiff = idealRowBuffer - (lastFullyVisibleRow - row);
	
	if (bottomRowDiff > 0) {
		scrollPosition.row = Math.min(scrollPosition.row + bottomRowDiff, maxRow);
	}
	
	let colBuffer = 8;
	
	let [x] = screenCoordsFromRowCol(document.lines, row, col, scrollPosition, measurements);
	
	x -= calculateMarginOffset(document.lines, measurements);
	
	if (x < 1) {
		scrollPosition.x = Math.max(0, scrollPosition.x - x - colBuffer * colWidth);
	}
}

function setNormalSelection(selection) {
	normalSelection = selection;
	
	normalSelectionRegions = calculateNormalSelectionRegions(
		document.lines,
		normalSelection,
		scrollPosition,
		measurements,
	);
}

function updateSelectionEndCol() {
	let [lineIndex, offset] = normalSelection.end;
	let [, endCol] = rowColFromCursor(document.lines, lineIndex, offset);
	
	selectionEndCol = endCol;
}

function switchToAstMode() {
	if (mouseIsDown) {
		console.log("not switching to ast mode");
		return;
	}
	
	mode = "ast";
	
	console.log("switchToAstMode", mode);
	
	let selection = Selection.sort(normalSelection);
	let [startLineIndex] = selection.start;
	let [endLineIndex] = selection.end;
	
	astSelection = document.lang.codeIntel.astSelection.fromLineRange(document.lines, startLineIndex, endLineIndex);
	
	if (lastMouseMoveEvent) {
		astMouseHandler.hilite(lastMouseMoveEvent);
	}
}

function switchToNormalMode() {
	if (mouseIsDown) {
		console.log("not switching to normal mode");
		return;
	}
	
	mode = "normal";
	setAstSelectionHilite(null);
	
	console.log("switchToNormalMode", mode);
	
	let [topLineIndex] = astSelection;
	
	if (!normalSelection) {
		setNormalSelection(Selection.startOfLineContent(document.lines, topLineIndex));
		
		updateSelectionEndCol();
	}
}

function startCursorBlink() {
	if (cursorInterval) {
		clearInterval(cursorInterval);
	}
	
	cursorBlinkOn = true;
	
	cursorInterval = setInterval(function() {
		cursorBlinkOn = !cursorBlinkOn;
		
		updateCanvas();
	}, $prefs.cursorBlinkPeriod);
}

function updateCanvasSize() {
	canvas.width = canvasDiv.offsetWidth;
	canvas.height = canvasDiv.offsetHeight;
	
	/*
	setting width/height resets the context, so need to apply things
	like textBaseline here
	*/
	
	context.textBaseline = "bottom";
}

function updateWraps() {
	if ($prefs.wrap) {
		document.wrapLines(
			measurements,
			getCodeAreaSize().width,
		);
	} else {
		document.unwrapLines();
	}
}

let prevWidth;
let prevHeight;

function resize() {
	if (!canvasDiv) {
		return;
	}
	
	let {offsetWidth, offsetHeight} = canvasDiv;
	
	if (offsetWidth !== prevWidth || offsetHeight !== prevHeight) {
		updateCanvasSize();
		
		if (offsetWidth !== prevWidth) {
			updateWraps();
			updateSizes();
		}
		
		redraw();
		
		prevWidth = offsetWidth;
		prevHeight = offsetHeight;
	}
	
	if (visible) {
		setTimeout(resize, 50);
	}
}

function redraw() {
	updateScrollbars();
	updateCanvas();
}

function updateCanvas() {
	render(
		context,
		mode,
		document.lines,
		normalSelection,
		normalSelectionRegions,
		astSelection,
		astSelectionHilite,
		astInsertionHilite,
		isPeekingAstMode,
		hiliteWord,
		scrollPosition,
		$prefs,
		document.fileDetails,
		$prefs.langs[document.lang.code].colors,
		measurements,
		cursorBlinkOn,
		windowHasFocus,
	);
}

function updateMeasurements() {
	measurementsDiv.style = inlineStyle({
		font: $prefs.font,
	});
	
	measurementsDiv.innerHTML = "A".repeat(10000);
	
	measurements = {
		colWidth: measurementsDiv.offsetWidth / measurementsDiv.innerHTML.length,
		rowHeight: measurementsDiv.offsetHeight + rowHeightPadding,
	};
}

async function updateScrollbars() {
	updateVerticalScrollbar();
	updateHorizontalScrollbar();
	
	await tick();
	
	updateCanvasSize();
	updateCanvas();
}

function updateVerticalScrollbar() {
	let {rowHeight} = measurements;
	let {offsetHeight: height} = canvasDiv;
	
	let rows = document.countRows();
	
	let scrollHeight = (rows - 1) * rowHeight + height;
	let scrollTop = scrollPosition.row * rowHeight;
	let scrollMax = scrollHeight - height;
	let position = scrollTop / scrollMax;
	
	verticalScrollbar.update(scrollHeight, height, position);
}

function updateHorizontalScrollbar() {
	if (!hasHorizontalScrollbar) {
		return;
	}
	
	let {colWidth} = measurements;
	let {width} = getCodeAreaSize();
	
	let longestLineWidth = document.getLongestLineWidth();
	
	let scrollWidth = longestLineWidth * colWidth + width;
	let scrollMax = scrollWidth - width;
	let scrollLeft = scrollPosition.x;
	let position = scrollLeft / scrollMax;
	
	horizontalScrollbar.update(scrollWidth, width, position);
}

function verticalScroll({detail: position}) {
	let {rowHeight} = measurements;
	let {height} = canvas;
	
	let rows = document.countRows();
	let scrollHeight = (rows - 1) * rowHeight + height;
	let scrollMax = scrollHeight - height;
	
	let scrollTop = scrollMax * position;
	let scrollRows = Math.round(scrollTop / rowHeight);
	
	scrollPosition.row = scrollRows;
	
	updateCanvas();
}

function horizontalScroll({detail: position}) {
	let {colWidth} = measurements;
	let {width} = canvas;
	
	let longestLineWidth = document.getLongestLineWidth();
	let scrollWidth = longestLineWidth * colWidth + width;
	let scrollMax = scrollWidth - width;
	
	let scrollLeft = scrollMax * position;
	
	scrollPosition.x = scrollLeft;
	
	updateCanvas();
}

function getCodeAreaSize() {
	let {width, height} = canvas;
	
	let {
		colWidth,
		rowHeight,
	} = measurements;
	
	return {
		width: width - calculateMarginOffset(document.lines, measurements),
		height,
		rows: Math.floor(height / rowHeight),
		cols: Math.floor(width / colWidth),
	};
}

function updateSizes() {
	let {width, height} = canvas;
	let marginWidth = calculateMarginWidth(document.lines, measurements);
	let marginOffset = calculateMarginOffset(document.lines, measurements);
	
	sizes = {
		overallWidth: width,
		marginWidth,
		marginOffset,
	};
}

async function prefsUpdated() {
	if (!mounted) {
		return;
	}
	
	hasHorizontalScrollbar = !$prefs.wrap;
	
	await tick();
	
	updateMeasurements();
	startCursorBlink();
	updateCanvasSize();
	updateWraps();
	redraw();
}

onMount(async function() {
	context = canvas.getContext("2d");
	
	document.parse($prefs);
	
	focused = true; // DEV
	
	windowHasFocus = windowFocus.isFocused();
	
	updateMeasurements();
	resize();
	startCursorBlink();
	
	let teardown = [];
	
	teardown.push(document.on("edit", function() {
		revisionCounter++;
		// TODO perf
		// only modified lines need wraps recalculating
		// async parsing
		
		document.parse($prefs);
		
		updateWraps();
		updateSizes();
		
		if (mode === "ast") {
			setNormalSelection(null);
		}
	}));
	
	teardown.push(windowFocus.listen(function(isFocused) {
		windowHasFocus = isFocused;
		
		updateCanvas();
	}));
	
	mounted = true;
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<svelte:window
	on:keydown={keydown}
	on:keyup={keyup}
/>

<style type="text/scss">
@import "../../css/mixins/abs-sticky";
@import "../../css/classes/hide";

#main {
	display: grid;
	grid-template-rows: 1fr 0;
	grid-template-columns: 1fr 13px;
	grid-template-areas: "canvas verticalScrollbar" "horizontalScrollbar blank";
	color: black;
	
	/*width: 300px;
	height: 300px;
	margin: 50px;*/
	
	&.hasHorizontalScrollbar {
		grid-template-rows: 1fr 13px;
	}
}

#canvas {
	position: relative;
	grid-area: canvas;
	overflow: hidden;
}

.layer {
	@include abs-sticky;
	
	z-index: 1;
}

canvas {
	@include abs-sticky;
}

$scrollBarBorder: 1px solid #bababa;

#verticalScrollbar {
	position: relative;
	grid-area: verticalScrollbar;
	border-left: $scrollBarBorder;
}

#horizontalScrollbar {
	position: relative;
	grid-area: horizontalScrollbar;
	border-top: $scrollBarBorder;
}

#scrollbarSpacer {
	grid-area: blank;
	background: #E8E8E8;
}

#measurements {
	position: absolute;
	left: -9000px;
	top: -9000px;
}
</style>

<div
	id="main"
	on:wheel={wheel}
	class:hasHorizontalScrollbar
>
	<div
		id="canvas"
		bind:this={canvasDiv}
	>
		<div class="layer">
			<canvas bind:this={canvas}/>
		</div>
		<div class="layer">
			<InteractionLayer
				{mode}
				{document}
				{revisionCounter}
				overallWidth={sizes.overallWidth}
				marginWidth={sizes.marginWidth}
				marginOffset={sizes.marginOffset}
				rowHeight={measurements?.rowHeight}
				colWidth={measurements?.colWidth}
				{scrollPosition}
				{pickOptions}
				{dropTargets}
				on:mousedown={mousedown}
				on:mouseenter={mouseenter}
				on:mouseleave={mouseleave}
				on:mousemove={mousemove}
				on:mouseup={mouseup}
				on:click={click}
				on:dblclick={dblclick}
				on:optionmousedown={optionmousedown}
				on:optionhover={optionhover}
				on:dragstart={dragstart}
				on:dragover={dragover}
				on:dragend={dragend}
				on:drop={drop}
			/>
		</div>
	</div>
	<div
		class="scrollbar"
		id="verticalScrollbar"
	>
		<Scrollbar
			bind:this={verticalScrollbar}
			orientation="vertical"
			on:scroll={verticalScroll}
		/>
	</div>
	<div
		class="scrollbar"
		class:hide={!hasHorizontalScrollbar}
		id="horizontalScrollbar"
	>
		<Scrollbar
			bind:this={horizontalScrollbar}
			orientation="horizontal"
			on:scroll={horizontalScroll}
		/>
	</div>
	{#if hasHorizontalScrollbar}
		<div id="scrollbarSpacer"></div>
	{/if}
</div>

<div id="measurements" bind:this={measurementsDiv}></div>
