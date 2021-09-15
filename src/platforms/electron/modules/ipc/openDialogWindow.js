let ipcRenderer = require("platform/modules/ipcRenderer");

module.exports = function(url, options) {
	return ipcRenderer.invoke("openDialogWindow", "open", url, options);
}
