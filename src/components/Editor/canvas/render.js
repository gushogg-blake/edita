let renderCurrentLineHilite = require("./renderCurrentLineHilite");
let renderNormalSelection = require("./renderNormalSelection");
let renderAstSelection = require("./renderAstSelection");
let renderAstSelectionHilite = require("./renderAstSelectionHilite");
let renderAstInsertionHilite = require("./renderAstInsertionHilite");
let renderNormalHilites = require("./renderNormalHilites");
let renderCode = require("./renderCode");
let renderMargin = require("./renderMargin");
let renderNormalCursor = require("./renderNormalCursor");
let renderInsertCursor = require("./renderInsertCursor");

module.exports = function(layers, view, isPeekingAstMode, windowHasFocus) {
	let {
		width,
		height,
	} = view.sizes;
	
	let {
		mode,
	} = view;
	
	for (let context of Object.values(layers)) {
		context.clearRect(0, 0, width, height);
	}
	
	renderNormalHilites(layers, view);
	
	if (mode === "normal") {
		renderCurrentLineHilite(layers, view, windowHasFocus);
		renderNormalSelection(layers, view);
		renderNormalCursor(layers, view, windowHasFocus);
		renderInsertCursor(layers, view);
	}
	
	if (mode === "ast") {
		renderAstSelection(layers, view, isPeekingAstMode);
		renderAstSelectionHilite(layers, view, isPeekingAstMode);
		renderAstInsertionHilite(layers, view, isPeekingAstMode);
	}
	
	let rows = [...view.getRowsToRender()];
	
	renderCode(layers, view, rows);
	renderMargin(layers, view, rows);
}
