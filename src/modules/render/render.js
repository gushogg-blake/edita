let renderMarginBackground = require("./renderMarginBackground");
let renderCurrentLineHilite = require("./renderCurrentLineHilite");
let renderNormalSelection = require("./renderNormalSelection");
let renderAstSelection = require("./renderAstSelection");
let renderAstSelectionHilite = require("./renderAstSelectionHilite");
let renderAstInsertionHilite = require("./renderAstInsertionHilite");
//let renderWordHilites = require("./renderWordHilites");
let renderCodeAndMargin = require("./renderCodeAndMargin");
let renderNormalCursor = require("./renderNormalCursor");
let renderInsertCursor = require("./renderInsertCursor");

module.exports = function(
	context,
	mode,
	lines,
	normalSelection,
	normalSelectionRegions,
	insertCursor,
	astSelection,
	astSelectionHilite,
	astInsertionHilite,
	isPeekingAstMode,
	hiliteWord,
	scrollPosition,
	fileDetails,
	measurements,
	cursorBlinkOn,
	windowHasFocus,
) {
	//console.time("render");
	
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	
	renderMarginBackground(
		context,
		lines,
		measurements,
	);
	
	if (mode === "normal") {
		renderCurrentLineHilite(
			context,
			lines,
			normalSelection,
			scrollPosition,
			measurements,
			windowHasFocus,
		);
	}
	
	if (mode === "normal") {
		renderNormalSelection(
			context,
			normalSelectionRegions,
		);
	}
	
	if (mode === "ast") {
		renderAstSelection(
			context,
			lines,
			astSelection,
			isPeekingAstMode,
			scrollPosition,
			fileDetails,
			measurements,
		);
	}
	
	if (mode === "ast") {
		renderAstSelectionHilite(
			context,
			lines,
			astSelectionHilite,
			astSelection,
			isPeekingAstMode,
			scrollPosition,
			fileDetails,
			measurements,
		);
	}
	
	if (mode === "ast") {
		renderAstInsertionHilite(
			context,
			lines,
			astInsertionHilite,
			astSelection,
			isPeekingAstMode,
			scrollPosition,
			fileDetails,
			measurements,
		);
	}
	
	//renderWordHilites(
	//	context,
	//	lines,
	//	scrollPosition,
	//	measurements,
	//);
	
	renderCodeAndMargin(
		context,
		lines,
		scrollPosition,
		fileDetails,
		measurements,
	);
	
	if (mode === "normal") {
		// TODO multiple cursors
		// TODO block selections
		
		renderNormalCursor(
			context,
			lines,
			normalSelection,
			insertCursor,
			scrollPosition,
			measurements,
			cursorBlinkOn,
			windowHasFocus,
		);
	}
	
	if (mode === "normal") {
		renderInsertCursor(
			context,
			lines,
			insertCursor,
			scrollPosition,
			measurements,
		);
	}
	
	//console.timeEnd("render");
}
