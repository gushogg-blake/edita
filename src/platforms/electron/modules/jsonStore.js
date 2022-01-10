let ipcRenderer = require("platform/modules/ipcRenderer");

module.exports = {
	load(name, key) {
		return ipcRenderer.invoke("jsonStore", "load", name, key);
	},
	
	save(name, key, data) {
		return ipcRenderer.invoke("jsonStore", "save", name, key, JSON.stringify(data));
	},
	
	ls(name) {
		return ipcRenderer.invoke("jsonStore", "ls", name);
	},
	
	watch(name, fn) {
		return ipcRenderer.on("jsonStore.update", function(e, _name, key, value) {
			if (_name !== name) {
				return;
			}
			
			fn(key, value);
		});
	},
};
