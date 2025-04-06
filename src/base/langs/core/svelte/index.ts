import {Lang} from "core";

export default class extends Lang {
	group = "html";
	name = "Svelte";
	defaultExtension = "svelte";
	possibleInjections = ["javascript", "css", "scss", "sass"];
	injections = [];
	
	getHiliteClass(node) {
		// TODO
	}
	
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
	}
}
