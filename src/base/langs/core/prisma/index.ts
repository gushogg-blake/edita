import {Lang} from "core";

let keywords = new Set([
	//"model",
	//"datasource",
	//"generator",
]);

export default class extends Lang {
	group = "prisma";
	name = "Prisma";
	defaultExtension = "prisma";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"prisma",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
