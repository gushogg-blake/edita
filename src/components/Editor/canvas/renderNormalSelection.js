module.exports = function(layers, view) {
	let {
		normalSelection,
	} = view;
	
	let context = layers.hilites;
	
	context.fillStyle = platform.prefs.selectionBackground;
	
	let regions = view.calculateNormalSelectionRegions(normalSelection);
	
	for (let [x, y, width, height] of regions) {
		context.fillRect(x, y, width, height);
	}
}
