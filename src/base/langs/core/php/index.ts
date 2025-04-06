import {Lang} from "core";

export default class extends Lang {
	name = "PHP";
	defaultExtension = "php";
	possibleInjections = ["html"];
	
	injections = [
		{
			pattern: "(text) @injectionNode",
			combined: true,
			lang: "html",
		},
	];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"php",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
