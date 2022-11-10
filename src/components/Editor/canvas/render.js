let renderCurrentLineHilite = require("./renderCurrentLineHilite");
let renderNormalHilites = require("./renderNormalHilites");
let renderNormalSelection = require("./renderNormalSelection");
let renderAstSelection = require("./renderAstSelection");
let renderAstSelectionHilite = require("./renderAstSelectionHilite");
let renderAstInsertionHilite = require("./renderAstInsertionHilite");
let renderMargin = require("./renderMargin");
let renderFoldHilites = require("./renderFoldHilites");
let renderCode = require("./renderCode");
let renderNormalCursor = require("./renderNormalCursor");
let renderInsertCursor = require("./renderInsertCursor");

module.exports = function(layers, view, isPeekingAstMode, windowHasFocus) {
	let {width, height} = view.sizes;
	
	if (base.getPref("dev.timing.render")) {
		console.time("render");
	}
	
	for (let context of Object.values(layers)) {
		context.clearRect(0, 0, width, height);
	}
	
	layers.background.fillStyle = base.theme.editor.background;
	
	layers.background.fillRect(0, 0, width, height);
	
	view.render({
		currentLineHilite: renderCurrentLineHilite(layers, view),
		normalHilites: renderNormalHilites(layers, view),
		normalSelection: renderNormalSelection(layers, view),
		astSelection: renderAstSelection(layers, view),
		astSelectionHilite: renderAstSelectionHilite(layers, view),
		astInsertionHilite: renderAstInsertionHilite(layers, view),
		margin: renderMargin(layers, view),
		foldHilites: renderFoldHilites(layers, view),
		code: () => renderCode(layers, view),
		normalCursor: renderNormalCursor(layers, view),
		insertCursor: renderInsertCursor(layers, view),
	}, {
		isPeekingAstMode,
		windowHasFocus,
	});
	
	if (base.getPref("dev.timing.render")) {
		console.timeEnd("render");
	}
}
