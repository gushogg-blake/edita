let {dialog} = require("electron");

module.exports = function(app) {
	return {
		open(e) {
			app.browserWindowFromEvent(e).webContents.openDevTools();
		},
	};
}
