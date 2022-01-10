let {removeInPlace} = require("utils/arrayMethods");
let localStorage = require("platform/modules/localStorage");

module.exports = function(localStoragePrefix) {
	function storageKey(name, key) {
		return localStoragePrefix + (key ? name + "/" + key : name);
	}
	
	let watchers = {};
	
	return {
		load(name, key) {
			return localStorage.get(storageKey(name, key));
		},
		
		save(name, key, data) {
			localStorage.set(storageKey(name, key), data);
			
			if (watchers[name]) {
				for (let fn of watchers[name]) {
					fn(key, data);
				}
			}
		},
		
		ls(name) {
			let prefix = storageKey(name) + "/";
			
			return localStorage.keys().filter(key => key.startsWith(prefix)).map(key => key.substr(prefix.length));
		},
		
		watch(name, fn) {
			if (!watchers[name]) {
				watchers[name] = [];
			}
			
			watchers[name].push(fn);
			
			return function() {
				removeInPlace(watchers[name], handler);
				
				if (watchers[name].length === 0) {
					delete watchers[name];
				}
			}
		},
	};
}
