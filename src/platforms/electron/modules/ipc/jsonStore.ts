import ipcRenderer from "platforms/electron/modules/ipcRenderer";

export default {
	load(name, key) {
		return ipcRenderer.invoke("jsonStore", "load", name, key);
	},
	
	create(name, key, data) {
		return ipcRenderer.invoke("jsonStore", "create", name, key, JSON.stringify(data));
	},
	
	update(name, key, data) {
		return ipcRenderer.invoke("jsonStore", "update", name, key, JSON.stringify(data));
	},
	
	createOrUpdate(name, key, data) {
		return ipcRenderer.invoke("jsonStore", "createOrUpdate", name, key, JSON.stringify(data));
	},
	
	delete(name, key) {
		return ipcRenderer.invoke("jsonStore", "delete", name, key);
	},
	
	ls(name) {
		return ipcRenderer.invoke("jsonStore", "ls", name);
	},
	
	watch(name, fn) {
		return ipcRenderer.on("jsonStore.update", function(e, _name, key, value, type) {
			if (_name !== name) {
				return;
			}
			
			fn(key, value, type);
		});
	},
};
