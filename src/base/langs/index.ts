import {Lang} from "core";
import {AstIntel} from "modules/astIntel";
import {CodeIntel} from "modules/codeIntel";
import * as langModules from "./core";
import * as astIntelModules from "./astIntel";
import * as codeIntelModules from "./codeIntel";

class Registry<ClassType> {
	map: Record<string, InstanceType<ClassType>> = {};
	
	constructor(modules: Record<string, ClassType>) {
		for (let [langCode, Class] of Object.entries(modules)) {
			this.add(langCode, new Class(langCode));
		}
	}
	
	add(langCode: string, instance: InstanceType<ClassType>) {
		this.map[langCode] = instance;
	}
	
	get(langCode: string): InstanceType<ClassType> | null {
		return this.map[langCode] || null;
	}
	
	get all(): InstanceType<ClassType>[] {
		return Object.values(this.map);
	}
}

export function core() {
	return new Registry<typeof Lang>(langModules);
}

export function astIntel() {
	return new Registry<typeof AstIntel>(astIntelModules);
}

export function codeIntel() {
	return new Registry<typeof CodeIntel>(codeIntelModules);
}
