let {ipcRenderer} = window.require("electron");

module.exports = {
	getSystemInfo() {
		return ipcRenderer.sendSync("init/getSystemInfo");
	},
	
	getConfig() {
		return ipcRenderer.sendSync("init/getConfig");
	},
};
