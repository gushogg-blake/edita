import type {Lang} from "core";
import type {AstIntel} from "modules/astIntel";
import type {CodeIntel} from "modules/codeIntel";
import * as langModules from "./core";
import * as astIntelModules from "./astIntel";
import * as codeIntelModules from "./codeIntel";

class Registry<T> {
	map: Record<string, T> = {};
	
	constructor(modules: Record<string, ClassType extends typeof T>) {
		for (let [langCode, Class] of Object.entries(modules)) {
			this.add(langCode, new Class(langCode));
		}
	}
	
	add(langCode: string, instance: T) {
		this.map[langCode] = instance;
	}
	
	get(langCode: string): T | null {
		return this.map[langCode] || null;
	}
	
	get all(): T[] {
		return Object.values(this.map);
	}
}

export function core() {
	return new Registry<Lang>(langModules);
}

export function astIntel() {
	return new Registry<AstIntel>(astIntelModules);
}

export function codeIntel() {
	return new Registry<CodeIntel>(codeIntelModules);
}
