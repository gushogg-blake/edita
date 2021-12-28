let ipcRenderer = require("platform/modules/ipcRenderer");

let cache = {};

module.exports = {
	async load(key, _default=null) {
		if (cache[key]) {
			return cache[key];
		}
		
		let data = (await ipcRenderer.invoke("jsonStore", "load", key)) || _default;
		
		cache[key] = data;
		
		return data;
	},
	
	async save(key, data) {
		await ipcRenderer.invoke("jsonStore", "save", key, JSON.stringify(data));
		
		cache[key] = data;
	},
};
