import {Lang} from "core";

let loggedTypes = [];

let wordRe = /\w/;

export default class extends Lang {
	group = "c";
	name = "C++";
	defaultExtension = "cpp";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"cpp",
			"cxx",
			"cc",
		].includes(type)) {
			return "general";
		}
		
		if (type === "vala") {
			return "alternate";
		}
		
		return null;
	}
}
