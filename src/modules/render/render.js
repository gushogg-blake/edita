let renderMarginBackground = require("./renderMarginBackground");
//let renderCurrentLineHilite = require("./renderCurrentLineHilite");
let renderNormalSelection = require("./renderNormalSelection");
let renderAstSelection = require("./renderAstSelection");
let renderAstHilite = require("./renderAstHilite");
//let renderWordHilites = require("./renderWordHilites");
let renderCodeAndMargin = require("./renderCodeAndMargin");
let renderNormalCursor = require("./renderNormalCursor");
let renderAstCursor = require("./renderAstCursor");

module.exports = function(
	context,
	mode,
	lines,
	normalSelection,
	astSelection,
	astHilite,
	astCursor,
	hiliteWord,
	scrollPosition,
	lang,
	prefs,
	colors,
	measurements,
	cursorBlinkOn,
) {
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	
	renderMarginBackground(
		context,
		lines,
		prefs,
		measurements,
	);
	
	if (mode === "normal") {
		//renderCurrentLineHilite(
		//	context,
		//	lines,
		//	selection,
		//	scrollPosition,
		//	colors,
		//	measurements,
		//);
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
		renderAstSelection(
			context,
			lines,
			astSelection,
			scrollPosition,
			prefs,
			measurements,
		);
	}
	
	if (mode === "ast") {
		renderAstHilite(
			context,
			lines,
			astHilite,
			scrollPosition,
			prefs,
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
		lang,
		prefs,
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
		);
	}
	
	if (mode === "ast") {
		renderAstCursor(
			context,
			lines,
			astCursor,
			scrollPosition,
			measurements,
			cursorBlinkOn,
		);
	}
}
