import {removeInPlace} from "utils/array";
import localStorage from "platforms/web/modules/localStorage";

export default function(localStoragePrefix) {
	function storageKey(name, key) {
		let parts = [encodeURIComponent(name)];
		
		if (key) {
			parts.push(encodeURIComponent(key));
		}
		
		return localStoragePrefix + parts.join("/");
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
					fn(key, data.value);
				}
			}
		},
		
		ls(name) {
			let prefix = storageKey(name) + "/";
			
			return localStorage.keys().filter(key => key.startsWith(prefix)).map(key => decodeURIComponent(key.substr(prefix.length)));
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
