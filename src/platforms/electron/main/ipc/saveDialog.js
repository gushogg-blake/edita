let {dialog} = require("electron");

module.exports =  {
	show(options) {
		return dialog.showSaveDialog(options);
	},
};
