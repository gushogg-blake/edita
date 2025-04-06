import {Lang} from "core";
import {AstIntel} from "modules/astIntel";
import {CodeIntel} from "modules/codeIntel";
import {Hiliter} from "modules/hiliter";
import * as langModules from "./core";
import * as astIntelModules from "./astIntel";
import * as codeIntelModules from "./codeIntel";
import * as hiliterModules from "./hiliters";

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

/*
NOTE there's a bunch of repetition here but I don't know how to type
a generic to make it generic

something<ClassName> means an instance, so we can't use it to generify
the classes -- we have to use something<typeof ClassName> -- but then it's
a type, not a value, so we can't use it as a constructor. I think that's
the issue, anyway. It's like we need a ConstructorType to go along with
InstanceType.
*/

export function core() {
	let registry = new Registry<Lang>();
	
	for (let [langCode, LangClass] of Object.entries(langModules)) {
		registry.add(langCode, new LangClass(langCode));
	}
	
	return registry;
}

export function astIntel() {
	let registry = new Registry<AstIntel>();
	
	for (let [langCode, AstIntelClass] of Object.entries(astIntelModules)) {
		registry.add(langCode, new AstIntelClass(langCode));
	}
	
	return registry;
}

export function codeIntel() {
	let registry = new Registry<CodeIntel>();
	
	for (let [langCode, CodeIntelClass] of Object.entries(codeIntelModules)) {
		registry.add(langCode, new CodeIntelClass(langCode));
	}
	
	return registry;
}

export function hiliters() {
	let registry = new Registry<Hiliter>();
	
	for (let [langCode, HiliterClass] of Object.entries(hiliterModules)) {
		registry.add(langCode, new HiliterClass(langCode));
	}
	
	return registry;
}
