import {Lang} from "core";

let wordRe = /\w/;

export default class extends Lang {
	group = "c";
	name = "C";
	defaultExtension = "c";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"c",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
