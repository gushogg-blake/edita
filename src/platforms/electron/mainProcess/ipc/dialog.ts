let {dialog} = require("electron");

export default function(app) {
	return {
		showOpen(e, options) {
			return dialog.showOpenDialog(app.browserWindowFromEvent(e), options);
		},
		
		showSave(e, options) {
			return dialog.showSaveDialog(app.browserWindowFromEvent(e), options);
		},
	};
}
