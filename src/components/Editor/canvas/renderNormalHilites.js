module.exports = function(layers, view) {
	let {
		normalHilites,
	} = view;
	
	let context = layers.hilites;
	
	context.fillStyle = base.theme.hiliteBackground;
	
	for (let selection of normalHilites) {
		let regions = view.calculateNormalSelectionRegions(selection);
		
		for (let [x, y, width, height] of regions) {
			context.fillRect(x, y, width, height);
		}
	}
}
