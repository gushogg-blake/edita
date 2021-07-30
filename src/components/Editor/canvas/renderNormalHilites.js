module.exports = function(context, view) {
	let {
		normalHilites,
	} = view;
	
	context.fillStyle = app.prefs.hiliteBackground;
	
	for (let selection of normalHilites) {
		let regions = view.calculateNormalSelectionRegions(selection);
		
		for (let [x, y, width, height] of regions) {
			context.fillRect(x, y, width, height);
		}
	}
}
