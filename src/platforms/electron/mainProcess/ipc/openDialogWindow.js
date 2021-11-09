module.exports = function(app) {
	return {
		open(e, name, dialogOptions) {
			app.openDialogWindow(name, dialogOptions, app.browserWindowFromEvent(e));
		},
	};
}
