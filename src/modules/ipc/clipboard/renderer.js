let {ipcRenderer: ipc} = window.require("electron-better-ipc");

module.exports = {
	read() {
		return ipc.callMain("clipboard/readSelection");
	},
	
	write(str) {
		return ipc.callMain("clipboard/write", [str]);
	},
	
	readSelection() {
		return ipc.callMain("clipboard/readSelection");
	},
	
	writeSelection(str) {
		return ipc.callMain("clipboard/writeSelection", [str]);
	},
};
