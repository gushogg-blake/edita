import {Evented, type AsyncOrSync} from "utils";
import JsonStore, {type Migration} from "./JsonStore";

export default class Singleton<StoreValue = any> extends Evented<{
	update: StoreValue;
}> {
	private store: JsonStore<StoreValue>;
	
	constructor(name: string, defaultValue: StoreValue, migrations: Record<string, Migration>) {
		super();
		
		this.store = new JsonStore<StoreValue>(name, defaultValue, migrations);
		
		this.store.on("create", ({value}) => this.fire("update", value));
		this.store.on("update", ({value}) => this.fire("update", value));
	}
	
	get defaultValue() {
		return this.store.defaultValue;
	}
	
	load(): AsyncOrSync<StoreValue> {
		return this.store.load("default");
	}
	
	save(value: StoreValue): AsyncOrSync<void> {
		return this.store.createOrUpdate("default", value);
	}
}
