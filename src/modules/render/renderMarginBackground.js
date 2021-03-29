let calculateMarginWidth = require("./calculateMarginWidth");

module.exports = function(
	context,
	lines,
	prefs,
	measurements,
) {
	let {height} = context.canvas;
	
	context.fillStyle = prefs.marginBackground;
	context.fillRect(0, 0, calculateMarginWidth(lines, measurements), height);
}
