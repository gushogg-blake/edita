import bluebird from "bluebird";
import {Evented} from "utils";

/*
think of a JsonStore like a database table -- it probably
should be one, really, but not sure if the complexity's worth
it yet.

for now they are stored as folders with JSON files on electron
and in localStorage on web.

for singleton stores (prefs, session state, etc) see Singleton.
*/

export type Migration = (value: any) => any | undefined;
export type StoreValue = any;

export default class JsonStore extends Evented<{
	create: {key: string; value: StoreValue};
	update: {key: string; value: StoreValue};
	delete: {key: string; value: StoreValue};
}> {
	private name: string;
	private defaultValue: StoreValue;
	private migrations: Record<string, Migration>;
	private versions: number[];
	private latestVersion: number;
	
	constructor(name: string, defaultValue: StoreValue, migrations: Record<string, Migration>) {
		super();
		
		this.name = name;
		this.defaultValue = defaultValue;
		this.migrations = migrations;
		
		this.versions = Object.keys(this.migrations || {}).map(Number).sort((a, b) => a - b);
		this.latestVersion = this.versions.length > 0 ? this.versions.at(-1) : -1;
		
		if (platform.jsonStore.watch) {
			platform.jsonStore.watch(name, (key: string, value: StoreValue, type) => {
				this.fire(type, {key, value});
			});
		}
	}
	
	async load(key: string): Promise<StoreValue> {
		let json = await platform.jsonStore.load(this.name, key);
		
		if (!json) {
			return this.defaultValue;
		}
		
		// NOTE only required for migrating non-store values to stores
		// can remove once done (snippets)
		let save;
		if (json._version === undefined) {
			save = true;
			json = {_version: -1, value: json};
		}
		
		let {_version, value} = json;
		
		let newVersions = this.versions.filter(n => n > _version);
		
		for (let newVersion of newVersions) {
			let newValue = this.migrations[newVersion](value, key);
			
			if (newValue !== undefined) {
				value = newValue;
			}
		}
		
		if (newVersions.length > 0 || save /* remove */) {
			await this.createOrUpdate(key, value);
		}
		
		return value;
	}
	
	create(key: string, value: StoreValue): Promise<void> {
		return platform.jsonStore.create(this.name, key, this.wrap(value));
	}
	
	update(key: string, value: StoreValue): Promise<void> {
		return platform.jsonStore.update(this.name, key, this.wrap(value));
	}
	
	createOrUpdate(key: string, value: StoreValue): Promise<void> {
		return platform.jsonStore.createOrUpdate(this.name, key, this.wrap(value));
	}
	
	delete(key: string, value: StoreValue): Promise<void> {
		return platform.jsonStore.delete(this.name, key);
	}
	
	wrap(value) {
		return {
			_version: this.latestVersion,
			value,
		};
	}
	
	async loadAll(): Promise<Record<string, StoreValue>> {
		let keys = await platform.jsonStore.ls(this.name);
		let all = {};
		
		await bluebird.map(keys, async (key) => {
			all[key] = await this.load(key);
		});
		
		return all;
	}
}
