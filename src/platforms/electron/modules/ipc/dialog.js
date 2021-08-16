let {ipcRenderer: ipc} = require("electron-better-ipc");

module.exports = {
	showSave(options) {
		return ipc.callMain("dialog/showSave", [options]);
	},
	
	showOpen(options) {
		return ipc.callMain("dialog/showOpen", [options]);
	},
	
	showMessageBox(options) {
		return ipc.callMain("dialog/showMessageBox", [options]);
	},
}
