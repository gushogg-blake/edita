import type {AsyncOrSync} from "utils";

export type JsonStore = {
	load(name: string, key: string): AsyncOrSync<any>;
	create(name: string, key: string, data: any): AsyncOrSync<string>;
	update(name: string, key: string, data: any): AsyncOrSync<void>;
	createOrUpdate(name: string, key: string, data: any): AsyncOrSync<void>;
	delete(name: string, key: string): AsyncOrSync<void>;
	ls(name: string): AsyncOrSync<string[]>;
	watch(name: string, callback: (key: string, value: any, type: string) => void): void;
};
