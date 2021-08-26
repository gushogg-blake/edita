let renderMarginBackground = require("./renderMarginBackground");
let renderCurrentLineHilite = require("./renderCurrentLineHilite");
let renderNormalSelection = require("./renderNormalSelection");
let renderAstSelection = require("./renderAstSelection");
let renderAstSelectionHilite = require("./renderAstSelectionHilite");
let renderAstInsertionHilite = require("./renderAstInsertionHilite");
let renderNormalHilites = require("./renderNormalHilites");
let renderCodeAndMargin = require("./renderCodeAndMargin");
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
	
	renderMarginBackground(layers, view);
	
	if (mode === "normal") {
		renderCurrentLineHilite(layers, view, windowHasFocus);
	}
	
	renderNormalHilites(layers, view);
	
	if (mode === "normal") {
		renderNormalSelection(layers, view);
	}
	
	if (mode === "ast") {
		renderAstSelection(layers, view, isPeekingAstMode);
	}
	
	if (mode === "ast") {
		renderAstSelectionHilite(layers, view, isPeekingAstMode);
	}
	
	if (mode === "ast") {
		renderAstInsertionHilite(layers, view, isPeekingAstMode);
	}
	
	renderCodeAndMargin(layers, view);
	
	if (mode === "normal") {
		renderNormalCursor(layers, view, windowHasFocus);
	}
	
	if (mode === "normal") {
		renderInsertCursor(layers, view);
	}
}
