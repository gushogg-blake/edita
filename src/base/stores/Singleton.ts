import {Evented} from "utils";
import JsonStore, {type StoreValue, type Migration} from "./JsonStore";

export default class Singleton extends Evented<{
	update: StoreValue;
}> {
	private store: JsonStore;
	
	constructor(name: string, defaultValue: StoreValue, migrations: Record<string, Migration>) {
		super();
		
		this.store = new JsonStore(name, defaultValue, migrations);
		
		this.store.on("create", ({value}) => this.fire("update", value));
		this.store.on("update", ({value}) => this.fire("update", value));
	}
	
	load(): Promise<StoreValue> {
		return this.store.load("default");
	}
	
	save(value: StoreValue): Promise<void> {
		return this.store.createOrUpdate("default", value);
	}
}
