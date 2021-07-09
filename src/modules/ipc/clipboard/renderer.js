let {ipcRenderer} = window.require("electron");

module.exports = {
	read() {
		return ipcRenderer.sendSync("clipboard/read");
	},
	
	write(str) {
		return ipcRenderer.sendSync("clipboard/write", [str]);
	},
	
	readSelection() {
		return ipcRenderer.sendSync("clipboard/readSelection");
	},
	
	writeSelection(str) {
		return ipcRenderer.sendSync("clipboard/writeSelection", [str]);
	},
};
