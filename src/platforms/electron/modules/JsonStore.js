let JsonStore = require("modules/JsonStore");
let ipcRenderer = require("platform/modules/ipcRenderer");

module.exports = JsonStore({
	load(name, key) {
		return ipcRenderer.invoke("jsonStore", "load", name, key);
	},
	
	save(name, key, data) {
		return ipcRenderer.invoke("jsonStore", "save", name, key, JSON.stringify(data));
	},
	
	watch(fn) {
		return ipcRenderer.on("jsonStore.update", (e, name, key, value) => fn(name, key, value));
	},
});
