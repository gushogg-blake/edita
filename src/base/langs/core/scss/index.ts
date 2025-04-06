import {Lang} from "core";

export default class extends Lang {
	group = "css";
	name = "SCSS";
	defaultExtension = "scss";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"scss",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
