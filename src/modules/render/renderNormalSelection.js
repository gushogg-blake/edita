module.exports = function(
	context,
	regions,
) {
	context.fillStyle = app.prefs.selectionBackground;
	
	for (let [x, y, width, height] of regions) {
		context.fillRect(x, y, width, height);
	}
}
