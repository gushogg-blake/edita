import type {AsyncOrSync} from "utils";

export type WatchEventType = "create" | "update" | "delete";

export type JsonStoreWatcher = (key: string, value: any, type: WatchEventType) => void;

export type JsonStore = {
	load(name: string, key: string): AsyncOrSync<any>;
	create(name: string, key: string, data: any): AsyncOrSync<void>;
	update(name: string, key: string, data: any): AsyncOrSync<void>;
	createOrUpdate(name: string, key: string, data: any): AsyncOrSync<void>;
	delete(name: string, key: string): AsyncOrSync<void>;
	ls(name: string): AsyncOrSync<string[]>;
	watch(name: string, callback: JsonStoreWatcher): void;
};
