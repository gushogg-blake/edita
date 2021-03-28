let renderCurrentLineHilite = require("./renderCurrentLineHilite");
let renderSelection = require("./renderSelection");
let renderWordHilites = require("./renderWordHilites");
let renderCodeAndMargin = require("./renderCodeAndMargin");
let renderCursor = require("./renderCursor");

/*
scroll position

scrollPosition has row and col - visual lines/cols

render receives all lines

scan all lines to calculate where to start rendering, taking account of wrapping
(lines are effectively variable height - one line != one row)

(scanning is fast, 0.7ms to search half way down a 30k line file)
*/


/*
word highlighting - just search for instances of the word in the line, and highlight
them.  needs to know about tab widths!  probably best to do as an entirely separate
layer - an underlay - as opposed to here (maybe each line could store a repr of itself
with tabs replaced with spaces though, to make that much simpler?)
*/


module.exports = function(
	context,
	lines,
	selection,
	hiliteWord,
	scrollPosition,
	font,
	colors,
	measurements,
	cursorBlinkOn,
) {
	console.time("render");
	
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	
	renderCurrentLineHilite(
		context,
		lines,
		selection,
		scrollPosition,
		colors,
		measurements,
	);
	
	renderSelection(
		context,
		lines,
		selection,
		scrollPosition,
		colors,
		measurements,
	);
	
	renderWordHilites(
		context,
		lines,
		selection,
		scrollPosition,
		colors,
		measurements,
	);
	
	renderCodeAndMargin(
		context,
		lines,
		selection,
		scrollPosition,
		font,
		colors,
		measurements,
	);
	
	renderCursor(
		context,
		lines,
		selection,
		scrollPosition,
		measurements,
		cursorBlinkOn,
	);
	
	console.timeEnd("render");
}
