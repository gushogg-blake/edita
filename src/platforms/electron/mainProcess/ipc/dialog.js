let {dialog} = require("electron");

module.exports = function(app) {
	return {
		showOpen(options, browserWindow) {
			return dialog.showOpenDialog(browserWindow, options);
		},
		
		showSave(options, browserWindow) {
			return dialog.showSaveDialog(browserWindow, options);
		},
		
		showMessageBox(options, browserWindow) {
			return dialog.showMessageBox(browserWindow, options);
		},
	};
}
