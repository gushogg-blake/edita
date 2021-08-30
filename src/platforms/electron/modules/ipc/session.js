let {ipcRenderer} = require("electron");

module.exports = {
	load() {
		return ipcRenderer.invoke("session/load");
	},
	
	save(session) {
		return ipcRenderer.invoke("session/save", session);
	},
};
