let {ipcRenderer} = require("electron");

module.exports = function(url, options) {
	return ipcRenderer.invoke("openDialogWindow", "open", url, options);
}
