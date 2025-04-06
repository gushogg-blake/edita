import {Lang} from "core";

export default class extends Lang {
	name = "Python";
	defaultExtension = "py";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"py",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
