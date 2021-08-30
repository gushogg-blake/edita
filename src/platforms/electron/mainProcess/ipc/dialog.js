let {dialog} = require("electron");

module.exports = function(app) {
	return {
		showOpen(e, options) {
			return dialog.showOpenDialog(app.browserWindowFromEvent(e), options);
		},
		
		showSave(e, options) {
			return dialog.showSaveDialog(app.browserWindowFromEvent(e), options);
		},
		
		showMessageBox(e, options) {
			return dialog.showMessageBox(app.browserWindowFromEvent(e), options);
		},
	};
}
