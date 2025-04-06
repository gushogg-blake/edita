import {Lang} from "core";

export default class extends Lang {
	name = "CodePatterns Query";
	defaultExtension = "cp";
	//reparseOnEdit = true; // HACK
	possibleInjections = ["tsq"];
	
	injections = [
		{
			pattern: "(tsq) @injectionNode",
			combined: true,
			lang: "tsq",
		},
	];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"cp",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
