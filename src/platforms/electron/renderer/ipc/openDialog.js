let {ipcRenderer: ipc} = window.require("electron-better-ipc");

module.exports = function(options) {
	return ipc.callMain("openDialog/show", [options]);
}
