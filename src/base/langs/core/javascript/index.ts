import {Lang} from "core";

let keywords = new Set([
	"async",
	"await",
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"export",
	"extends",
	"false",
	"finally",
	"for",
	"from",
	"function",
	"get",
	"if",
	"in",
	"instanceof",
	"import",
	"let",
	"new",
	"null",
	"of",
	"return",
	"set",
	"static",
	"super",
	"switch",
	"this",
	"throw",
	"true",
	"try",
	"typeof",
	"undefined",
	"var",
	"void",
	"while",
	"with",
	"yield",
]);

export default class extends Lang {
	group = "javascript";
	name = "JavaScript";
	defaultExtension = "js";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"js",
			"cjs",
			"es",
			"es6",
			"mjs",
			"jsx",
		].includes(type)) {
			return "general";
		}
		
		if ([
			"json",
			"json5",
		].includes(type)) {
			return "alternate";
		}
		
		return null;
	}
}
