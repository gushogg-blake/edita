let {ipcRenderer: ipc} = window.require("electron-better-ipc");

module.exports = {
	getSystemInfo() {
		return ipc.callMain("init/getSystemInfo");
	},
	
	getConfig() {
		return ipc.callMain("init/getConfig");
	},
};
