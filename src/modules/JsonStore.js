let Evented = require("utils/Evented");

class JsonStore extends Evented {
	constructor(name, defaultValue, migrations={}) {
		super();
		
		this.name = name;
		
		this.defaultValue = defaultValue;
		
		this.migrations = migrations;
		this.versions = Object.keys(this.migrations || {}).map(Number).sort((a, b) => a - b);
		this.version = this.versions.length > 0 ? this.versions[this.versions.length - 1] : -1;
		
		if (platform.jsonStore.watch) {
			platform.jsonStore.watch(name, (key, value) => {
				this.fire("update", key, value);
			});
		}
	}
	
	async load(key=null) {
		let json = await platform.jsonStore.load(this.name, key);
		
		if (json?._version === undefined || !json?.value) {
			return this.defaultValue;
		}
		
		let {_version, value} = json;
		
		let newVersions = this.versions.filter(n => n > _version);
		
		for (let newVersion of newVersions) {
			let newValue = this.migrations[newVersion](value);
			
			if (newValue !== undefined) {
				value = newValue;
			}
			
			this.version = newVersion;
		}
		
		return value;
	}
	
	save(key, value) {
		if (arguments.length === 1) {
			value = key;
			key = null;
		}
		
		return platform.jsonStore.save(this.name, key, {
			_version: this.version,
			value,
		});
	}
}

module.exports = JsonStore;
