let calculateNormalSelectionRegions = require("../utils/calculateNormalSelectionRegions");

module.exports = function(
	context,
	lines,
	normalSelection,
	scrollPosition,
	measurements,
) {
	context.fillStyle = app.prefs.selectionBackground;
	
	let regions = calculateNormalSelectionRegions(
		lines,
		normalSelection,
		scrollPosition,
		measurements,
	);
	
	for (let [x, y, width, height] of regions) {
		context.fillRect(x, y, width, height);
	}
}
