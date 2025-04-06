import {Lang} from "core";
import type {Document, Node} from "core";

export default class extends Lang {
	group = "javascript";
	name = "TypeScript";
	defaultExtension = "ts";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"ts",
			"mts",
			"cts",
		].includes(type)) {
			return "general";
		}
		
		if ([
			"js",
			"cjs",
			"es",
			"es6",
			"mjs",
		].includes(type)) {
			return "alternate";
		}
		
		return null;
	}
}
