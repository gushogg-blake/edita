let {ipcRenderer} = require("electron");

/*
note - these methods are sync, but code should treat platform.clipboard
methods as async as they are async on web
*/

module.exports = {
	read() {
		return ipcRenderer.sendSync("clipboard", "read");
	},
	
	write(str) {
		return ipcRenderer.sendSync("clipboard", "write", str);
	},
	
	readSelection() {
		return ipcRenderer.sendSync("clipboard", "readSelection");
	},
	
	writeSelection(str) {
		return ipcRenderer.sendSync("clipboard", "writeSelection", str);
	},
};
