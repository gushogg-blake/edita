let calculateNormalSelectionRegions = require("../utils/calculateNormalSelectionRegions");

module.exports = function(
	context,
	lines,
	normalHilites,
	scrollPosition,
	measurements,
) {
	context.fillStyle = app.prefs.hiliteBackground;
	
	for (let selection of normalHilites) {
		let regions = calculateNormalSelectionRegions(
			lines,
			selection,
			scrollPosition,
			measurements,
		);
		
		for (let [x, y, width, height] of regions) {
			context.fillRect(x, y, width, height);
		}
	}
}
