let {Menu} = require("electron");

module.exports = function(app) {
	return {
		open(e, url, options) {
			app.openDialogWindow(url, options, app.browserWindowFromEvent(e));
		},
	};
}
