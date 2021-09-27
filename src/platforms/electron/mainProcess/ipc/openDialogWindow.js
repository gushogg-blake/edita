module.exports = function(app) {
	return {
		open(e, name, dialogOptions, windowOptions) {
			app.openDialogWindow(name, dialogOptions, windowOptions, app.browserWindowFromEvent(e));
		},
	};
}
