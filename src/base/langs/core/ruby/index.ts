import {Lang} from "core";

export default class extends Lang {
	group = "ruby";
	name = "Ruby";
	defaultExtension = "rb";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"rb",
			"erb",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
