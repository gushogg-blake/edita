import astMode from "./astMode";
import codeIntel from "./codeIntel";

let lang = {
	group: "html",
	code: "svelte",
	name: "Svelte",
	defaultExtension: "svelte",
	astMode,
	codeIntel,
	possibleInjections: ["javascript", "css", "scss", "sass"],
	injections: [],
	
	getFooter(node) {
		return null;
	},
	
	getHeader(node) {
		return null;
	},
	
	getHiliteClass(node) {
		// TODO
	},
	
	getSupportLevel(code, path) {
		let type = platform.fs(path).lastType;
		
		if ([
			"svelte",
		].includes(type)) {
			return "specific";
		}
		
		if ([
			"html",
		].includes(type)) {
			return "alternate";
		}
		
		return null;
	},
};

export default lang;
