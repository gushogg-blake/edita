import {Lang} from "core";
import * as langModules from "./modules";

class Langs {
	langs: Record<string, Lang> = {};
	
	add(LangClass) {
		let lang = new LangClass();
		
		this.langs[lang.code] = lang;
	}
	
	get(code: string): Lang | null {
		return this.langs[code] || null;
	}
	
	get all(): Lang[] {
		return Object.values(this.langs);
	}
}

export default function() {
	let langs = new Langs();
	
	for (let LangClass of Object.values(langModules)) {
		langs.add(LangClass);
	}
	
	return langs;
}
