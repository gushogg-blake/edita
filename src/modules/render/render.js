let renderMarginBackground = require("./renderMarginBackground");
let renderCurrentLineHilite = require("./renderCurrentLineHilite");
let renderNormalSelection = require("./renderNormalSelection");
let renderAstSelection = require("./renderAstSelection");
let renderAstHilite = require("./renderAstHilite");
//let renderWordHilites = require("./renderWordHilites");
let renderCodeAndMargin = require("./renderCodeAndMargin");
let renderNormalCursor = require("./renderNormalCursor");

module.exports = function(
	context,
	mode,
	lines,
	normalSelection,
	astSelection,
	astHilite,
	isPeekingAstMode,
	hiliteWord,
	scrollPosition,
	prefs,
	fileDetails,
	colors,
	measurements,
	cursorBlinkOn,
	windowHasFocus,
) {
	//console.time("render");
	
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	
	renderMarginBackground(
		context,
		lines,
		prefs,
		measurements,
	);
	
	if (mode === "normal") {
		renderCurrentLineHilite(
			context,
			lines,
			normalSelection,
			scrollPosition,
			colors,
			measurements,
			windowHasFocus,
		);
	}
	
	if (mode === "normal") {
		renderNormalSelection(
			context,
			lines,
			normalSelection,
			scrollPosition,
			prefs,
			measurements,
		);
	}
	
	if (mode === "ast") {
		renderAstHilite(
			context,
			lines,
			astSelection,
			astHilite,
			isPeekingAstMode,
			scrollPosition,
			prefs,
			fileDetails,
			measurements,
		);
	}
	
	if (mode === "ast") {
		renderAstSelection(
			context,
			lines,
			astSelection,
			astHilite,
			isPeekingAstMode,
			scrollPosition,
			prefs,
			fileDetails,
			measurements,
		);
	}
	
	//renderWordHilites(
	//	context,
	//	lines,
	//	scrollPosition,
	//	colors,
	//	measurements,
	//);
	
	renderCodeAndMargin(
		context,
		lines,
		scrollPosition,
		prefs,
		fileDetails,
		colors,
		measurements,
	);
	
	if (mode === "normal") {
		// TODO multiple cursors
		// TODO block selections
		
		renderNormalCursor(
			context,
			lines,
			normalSelection,
			scrollPosition,
			measurements,
			cursorBlinkOn,
			windowHasFocus,
		);
	}
	
	//console.timeEnd("render");
}
