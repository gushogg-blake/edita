module.exports = function(context, view) {
	let {
		normalSelection,
	} = view;
	
	context.fillStyle = app.prefs.selectionBackground;
	
	let regions = view.calculateNormalSelectionRegions(normalSelection);
	
	for (let [x, y, width, height] of regions) {
		context.fillRect(x, y, width, height);
	}
}
