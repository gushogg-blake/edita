module.exports = function(context, view) {
	let {
		marginWidth,
		height,
	} = view.sizes;
	
	context.fillStyle = app.prefs.marginBackground;
	context.fillRect(0, 0, marginWidth, height);
}
