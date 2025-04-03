import ipcRenderer from "platforms/electron/modules/ipcRenderer";
import type {JsonStoreWatcher} from "platforms/common/JsonStore";

// TYPE use unknown instead of any for the values?

export default {
	load(name: string, key: string): any {
		return ipcRenderer.invoke("jsonStore", "load", name, key);
	},
	
	create(name: string, key: string, data: any) {
		return ipcRenderer.invoke("jsonStore", "create", name, key, JSON.stringify(data));
	},
	
	update(name: string, key: string, data: any) {
		return ipcRenderer.invoke("jsonStore", "update", name, key, JSON.stringify(data));
	},
	
	createOrUpdate(name: string, key: string, data: any) {
		return ipcRenderer.invoke("jsonStore", "createOrUpdate", name, key, JSON.stringify(data));
	},
	
	delete(name: string, key: string) {
		return ipcRenderer.invoke("jsonStore", "delete", name, key);
	},
	
	ls(name: string) {
		return ipcRenderer.invoke("jsonStore", "ls", name);
	},
	
	watch(name: string, fn: JsonStoreWatcher) {
		return ipcRenderer.on("jsonStore.update", function(e, _name: string, key: string, value: any, type: string) {
			if (_name !== name) {
				return;
			}
			
			fn(key, value, type);
		});
	},
};
