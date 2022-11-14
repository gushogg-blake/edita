let renderCurrentLineHilite = require("./renderCurrentLineHilite");
let renderNormalSelections = require("./renderNormalSelections");
let renderAstSelection = require("./renderAstSelection");
let renderAstSelectionHilite = require("./renderAstSelectionHilite");
let renderAstInsertionHilite = require("./renderAstInsertionHilite");
let renderMargin = require("./renderMargin");
let renderFoldHilites = require("./renderFoldHilites");
let renderCode = require("./renderCode");
let renderNormalCursor = require("./renderNormalCursor");

module.exports = function(layers, view, isPeekingAstMode, windowHasFocus) {
	let {
		sizes: {width, height, topMargin, marginOffset},
		measurements: {rowHeight},
		scrollPosition,
	} = view;
	
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
		normalHilites: renderNormalSelections(layers, view, base.theme.editor.hiliteBackground, offsets),
		normalSelection: renderNormalSelections(layers, view, base.theme.editor.selectionBackground, offsets),
		astSelection: renderAstSelection(layers, view, offsets),
		astSelectionHilite: renderAstSelectionHilite(layers, view, offsets),
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
	}
}
