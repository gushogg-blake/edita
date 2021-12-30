let JsonStore = require("module/JsonStore");
let localStorage = require("platform/modules/localStorage");

module.exports = JsonStore({
	load(name, key) {
		return localStorage.get(platform.options.localStoragePrefix + JsonStore.storageKey(name, key));
	},
	
	save(name, key, data) {
		localStorage.set(platform.options.localStoragePrefix + JsonStore.storageKey(name, key), data);
	},
});
