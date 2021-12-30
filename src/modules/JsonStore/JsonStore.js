let Evented = require("utils/Evented");
let migrations = require("./migrations");

module.exports = function(backend) {
	class JsonStore extends Evented {
		constructor(name, defaultValue=null) {
			super();
			
			this.name = name;
			this.defaultValue = defaultValue;
			this.migrations = migrations;
			this.versions = Object.keys(migrations[this.name] || {}).map(Number).sort((a, b) => a - b);
			this.version = this.versions.length > 0 ? this.versions[this.versions.length - 1] : -1;
			
			if (backend.watch) {
				backend.watch((name, key, value) => {
					if (name !== this.name) {
						return;
					}
					
					this.fire("update", key, value);
				});
			}
		}
		
		async load(key=null) {
			let json = await backend.load(this.name, key);
			
			if (json?._version === undefined || !json?.value) {
				return this.defaultValue;
			}
			
			let {_version, value} = json;
			
			let newVersions = this.versions.filter(n => n > _version);
			
			for (let newVersion of newVersions) {
				value = this.migrations[newVersion](value);
				
				this.version = newVersion;
			}
			
			return value;
		}
		
		save(key, value) {
			if (arguments.length === 1) {
				value = key;
				key = null;
			}
			
			return backend.save(this.name, key, {
				_version: this.version,
				value,
			});
		}
	}
	
	return JsonStore;
}
