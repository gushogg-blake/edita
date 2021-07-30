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

module.exports = function(context, view, isPeekingAstMode, windowHasFocus) {
	let {
		width,
		height,
	} = view.sizes;
	
	let {
		mode,
	} = view;
	
	context.clearRect(0, 0, width, height);
	
	renderMarginBackground(context, view);
	
	if (mode === "normal") {
		renderCurrentLineHilite(context, view, windowHasFocus);
	}
	
	renderNormalHilites(context, view);
	
	if (mode === "normal") {
		renderNormalSelection(context, view);
	}
	
	if (mode === "ast") {
		renderAstSelection(context, view, isPeekingAstMode);
	}
	
	if (mode === "ast") {
		renderAstSelectionHilite(context, view, isPeekingAstMode);
	}
	
	if (mode === "ast") {
		renderAstInsertionHilite(context, view, isPeekingAstMode);
	}
	
	renderCodeAndMargin(context, view);
	
	if (mode === "normal") {
		renderNormalCursor(context, view, windowHasFocus);
	}
	
	if (mode === "normal") {
		renderInsertCursor(context, view);
	}
}
