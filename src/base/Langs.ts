import Lang from "core/Lang";

export default class Langs {
	langs: Record<string, Lang> = {};
	
	constructor() {
		
	}
	
	add(langModule) {
		let lang = new Lang(langModule);
		
		this.langs[lang.code] = lang;
	}
	
	get(code: string): Lang | null {
		return this.langs[code] || null;
	}
	
	get all(): Lang[] {
		return Object.values(this.langs);
	}
}
