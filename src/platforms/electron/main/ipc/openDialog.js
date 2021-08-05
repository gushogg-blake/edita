let {dialog} = require("electron");

module.exports =  {
	show(options, browserWindow) {
		return dialog.showOpenDialog(browserWindow, options);
	},
};
