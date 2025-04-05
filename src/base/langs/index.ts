import type {Lang} from "core";
import * as coreModules from "./modules";

class Registry<T> {
	langs: Record<string, T> = {};
	
	add(langCode: string, module: T) {
		this.langs[langCode] = module;
	}
	
	get(langCode: string): T | null {
		return this.langs[langCode] || null;
	}
	
	get all(): T[] {
		return Object.values(this.langs);
	}
}

let langs = new Registry<Lang>();
let astIntel = new Registry<AstIntel>();
let codeIntel = new Registry<CodeIntel>();

export default function() {
	let langs = new Langs();
	
	for (let LangClass of Object.values(langModules)) {
		langs.add(LangClass);
	}
	
	return langs;
}
