let localStorage = require("platform/modules/localStorage");

module.exports = function(options) {
	function storageKey(name, key) {
		return key ? name + "/" + key : name;
	}
	
	return {
		load(name, key) {
			return localStorage.get(options.localStoragePrefix + storageKey(name, key));
		},
		
		save(name, key, data) {
			localStorage.set(options.localStoragePrefix + storageKey(name, key), data);
		},
	};
}
