module.exports = function(app) {
	return {
		call(e, channel, ...args) {
			return app.callRenderer(app.browserWindowFromEvent(e).getParentWindow(), channel, ...args);
		},
	};
}
