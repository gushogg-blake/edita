let {ipcRenderer} = require("electron");

/*
note - these methods are sync, but code should treat platform.clipboard
methods as async as they may be async on some platforms
*/

module.exports = {
	read() {
		return ipcRenderer.sendSync("clipboard/read");
	},
	
	write(str) {
		return ipcRenderer.sendSync("clipboard/write", str);
	},
	
	readSelection() {
		return ipcRenderer.sendSync("clipboard/readSelection");
	},
	
	writeSelection(str) {
		return ipcRenderer.sendSync("clipboard/writeSelection", str);
	},
};
