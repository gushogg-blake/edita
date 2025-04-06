import {Lang} from "core";

export default class extends Lang {
	group = "css";
	name = "CSS";
	defaultExtension = "css";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"css",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
