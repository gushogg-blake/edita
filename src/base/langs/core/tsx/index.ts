import {Lang} from "core";

export default class extends Lang {
	group = "javascript";
	name = "TSX";
	defaultExtension = "tsx";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"tsx",
		].includes(type)) {
			return "general";
		}
		
		if ([
			"jsx",
		].includes(type)) {
			return "alternate";
		}
		
		return null;
	}
}
