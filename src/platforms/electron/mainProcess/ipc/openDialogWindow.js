module.exports = function(app) {
	return {
		open(e, name, dialogOptions) {
			return app.openDialogWindow(name, dialogOptions, app.browserWindowFromEvent(e));
		},
	};
}
