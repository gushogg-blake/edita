module.exports = function(layers, view) {
	let {
		marginWidth,
		height,
	} = view.sizes;
	
	let context = layers.margin;
	
	context.fillStyle = platform.prefs.marginBackground;
	context.fillRect(0, 0, marginWidth, height);
}
