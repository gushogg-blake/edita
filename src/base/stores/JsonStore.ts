import bluebird from "bluebird";
import Evented from "utils/Evented";

class JsonStore extends Evented {
	constructor(name, defaultValue, migrations={}) {
		super();
		
		this.name = name;
		this.defaultValue = defaultValue;
		this.migrations = migrations;
		
		this.versions = Object.keys(this.migrations || {}).map(Number).sort((a, b) => a - b);
		this.version = this.versions.length > 0 ? this.versions.at(-1) : -1;
		
		if (platform.jsonStore.watch) {
			platform.jsonStore.watch(name, (key, value) => {
				this.fire("update", {key, value});
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
			let newValue = this.migrations[newVersion](value, key);
			
			if (newValue !== undefined) {
				value = newValue;
			}
			
			this.version = newVersion;
		}
		
		if (newVersions.length > 0) {
			await this.save(key, value);
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
	
	async loadAll() {
		let keys = await platform.jsonStore.ls(this.name);
		let all = {};
		
		await bluebird.map(keys, async (key) => {
			all[key] = await this.load(key);
		});
		
		return all;
	}
}

export default JsonStore;
