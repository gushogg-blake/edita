import type {Lang} from "core";
import type {AstIntel} from "modules/astIntel";
import type {CodeIntel} from "modules/codeIntel";
import * as langModules from "./core";
import * as astIntelModules from "./astIntel";
import * as codeIntelModules from "./codeIntel";

class Registry<T> {
	map: Record<string, T> = {};
	
	add(langCode: string, module: T) {
		this.map[langCode] = module;
	}
	
	get(langCode: string): T | null {
		return this.map[langCode] || null;
	}
	
	get all(): T[] {
		return Object.values(this.map);
	}
}

export function core() {
	let langs = new Registry<Lang>();
	
	for (let LangClass of Object.values(langModules)) {
		langs.add(new LangClass());
	}
	
	return langs;
}

export function astIntel() {
	let astIntel = new Registry<AstIntel>();
	
	for (let AstIntelClass of Object.values(astIntelModules)) {
		astIntel.add(new AstIntelClass());
	}
	
	return astIntel;
}

export function codeIntel() {
	let codeIntel = new Registry<CodeIntel>();
	
	for (let CodeIntelClass of Object.values(codeIntelModules)) {
		codeIntelModules.add(new CodeIntelClass());
	}
	
	return codeIntelModules;
}
