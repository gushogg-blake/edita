let {ipcRenderer} = require("electron");

module.exports = {
	load(key) {
		return ipcRenderer.invoke("jsonStore/load", key);
	},
	
	save(key, data) {
		return ipcRenderer.invoke("jsonStore/save", key, data);
	},
};
