let localStorage = require("platform/modules/localStorage");

module.exports = function(options) {
	function storageKey(name, key) {
		return options.localStoragePrefix + (key ? name + "/" + key : name);
	}
	
	return {
		load(name, key) {
			return localStorage.get(storageKey(name, key));
		},
		
		save(name, key, data) {
			localStorage.set(storageKey(name, key), data);
		},
		
		ls(name) {
			return localStorage.keys().filter(key => key.startsWith(storageKey(name) + "/"));
		},
	};
}
