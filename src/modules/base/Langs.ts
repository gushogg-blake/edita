import Lang from "modules/core/Lang";

export default class Langs {
	constructor() {
		this.langs = {};
		this.assignedAccelerators = new Set();
	}
	
	add(langModule) {
		let lang = new Lang(langModule);
		
		this.assignAccelerator(lang);
		
		this.langs[lang.code] = lang;
	}
	
	// assign accelerators on a first-come, first-served basis
	// this means langs should probably be listed in order of
	// most used. (currently this is not per-user configurable).
	// NOTE this seems to be not as good as just letting the
	// platform handle it, as linux at least cycles between options
	// if multiple labels begin with the same letter - turning
	// off for now (see components/App/Toolbar.svelte)
	
	assignAccelerator(lang) {
		let {name} = lang;
		
		lang.accelerator = name;
		
		for (let i = 0; i < name.length; i++) {
			let ch = name[i];
			
			if (this.assignedAccelerators.has(ch.toLowerCase())) {
				continue;
			}
			
			lang.accelerator = name.substr(0, i) + "&" + name.substr(i);
			
			this.assignedAccelerators.add(ch.toLowerCase());
			
			break;
		}
	}
	
	get(code) {
		return this.langs[code] || null;
	}
	
	get all() {
		return Object.values(this.langs);
	}
}
