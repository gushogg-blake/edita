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
	
	function notify(name, key, data, type) {
		if (watchers[name]) {
			for (let fn of watchers[name]) {
				fn(key, data.value, exists ? "update" : "create");
			}
		}
	}
	
	return {
		load(name, key) {
			return localStorage.get(storageKey(name, key));
		},
		
		update(name, key, data) {
			if (!this.has(name, key)) {
				throw new Error("Item doesn't exist: " + storageKey(name, key));
			}
			
			localStorage.set(storageKey(name, key), data);
			
			notify(name, key, data, "update");
		},
		
		create(name, key, data) {
			if (this.has(name, key)) {
				throw new Error("Item already exists: " + storageKey(name, key));
			}
			
			localStorage.set(storageKey(name, key), data);
			
			notify(name, key, data, "create");
		},
		
		createOrUpdate(name, key, data) {
			if (this.has(name, key)) {
				return this.update(name, key, data);
			} else {
				return this.create(name, key, data);
			}
		},
		
		ls(name) {
			let prefix = storageKey(name) + "/";
			
			return localStorage.keys().filter(key => key.startsWith(prefix)).map(key => decodeURIComponent(key.substr(prefix.length)));
		},
		
		has(name, key) {
			return localStorage.has(storageKey(name, key));
		},
		
		delete(name, key) {
			if (!this.has(name, key)) {
				throw new Error("Item doesn't exist: " + storageKey(name, key));
			}
			
			localStorage.remove(storageKey(name, key));
			
			notify(name, key, null, "delete");
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
