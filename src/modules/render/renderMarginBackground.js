let calculateMarginWidth = require("./calculateMarginWidth");

module.exports = function(
	context,
	lines,
	measurements,
) {
	let {height} = context.canvas;
	
	context.fillStyle = app.prefs.marginBackground;
	context.fillRect(0, 0, calculateMarginWidth(lines, measurements), height);
}
