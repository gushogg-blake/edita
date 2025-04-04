import renderCurrentLineHilite from "./renderCurrentLineHilite";
import renderNormalSelections from "./renderNormalSelections";
import renderAstSelection from "./renderAstSelection";
import renderAstInsertionHilite from "./renderAstInsertionHilite";
import renderMargin from "./renderMargin";
import renderFoldHilites from "./renderFoldHilites";
import renderCode from "./renderCode";
import renderNormalCursor from "./renderNormalCursor";

import type MiscOffsets from "./types";

export default function(layers, view, isPeekingAstMode, windowHasFocus) {
	let {
		sizes: {width, height, topMargin, marginOffset},
		measurements: {rowHeight},
		scrollPosition,
	} = view;
	
	let start = performance.now();
	
	if (base.getPref("dev.timing.render")) {
		console.time("render");
	}
	
	for (let context of Object.values(layers)) {
		context.clearRect(0, 0, width, height);
	}
	
	layers.background.fillStyle = base.theme.editor.background;
	
	layers.background.fillRect(0, 0, width, height);
	
	let offsets = {
		leftEdge: marginOffset - scrollPosition.x,
		rowOffset: -((scrollPosition.y - topMargin) % rowHeight),
	};
	
	view.render({
		currentLineHilite: renderCurrentLineHilite(layers, view, offsets),
		normalHilites: renderNormalSelections(layers, view, offsets, base.theme.editor.hiliteBackground),
		normalSelection: renderNormalSelections(layers, view, offsets, base.theme.editor.selectionBackground),
		astSelection: renderAstSelection(layers, view, offsets, base.theme.editor.astSelectionBackground),
		astSelectionHilite: renderAstSelection(layers, view, offsets, base.theme.editor.astSelectionHiliteBackground),
		astInsertionHilite: renderAstInsertionHilite(layers, view, offsets),
		margin: renderMargin(layers, view, offsets),
		foldHilites: renderFoldHilites(layers, view, offsets),
		code: () => renderCode(layers, view, offsets),
		normalCursor: renderNormalCursor(layers, view, offsets),
	}, {
		isPeekingAstMode,
		windowHasFocus,
	});
	
	if (base.getPref("dev.timing.render")) {
		console.timeEnd("render");
		
		let ms = performance.now() - start;
		let fps = 1000 / ms;
		
		//console.log("fps: " + Math.floor(fps));
	}
}
