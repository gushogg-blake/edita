module.exports = function(
	context,
	regions,
	prefs,
) {
	context.fillStyle = prefs.selectionBackground;
	
	for (let [x, y, width, height] of regions) {
		context.fillRect(x, y, width, height);
	}
}
