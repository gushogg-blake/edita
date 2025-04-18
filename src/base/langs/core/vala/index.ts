import {Lang} from "core";

let keywords = new Set([
	"abstract",
	"as",
	"async",
	"base",
	"bool",
	"break",
	"case",
	"catch",
	"char",
	"class",
	"const",
	"construct",
	"continue",
	"default",
	"delegate",
	"delete",
	"do",
	"double",
	"else",
	"ensures",
	"enum",
	"export",
	"false",
	"finally",
	"float",
	"for",
	"foreach",
	"get",
	"if",
	"in",
	"instanceof",
	"int",
	"int8",
	"int16",
	"int32",
	"int64",
	"interface",
	"is",
	"long",
	"namespace",
	"new",
	"null",
	"override",
	"owned",
	"out",
	"public",
	"private",
	"protected",
	"ref",
	"return",
	"requires",
	"set",
	"short",
	"signal",
	"static",
	"string",
	"struct",
	"switch",
	"this",
	"throw",
	"throws",
	"true",
	"try",
	"typeof",
	"uchar",
	"uint",
	"uint8",
	"uint16",
	"uint32",
	"uint64",
	"ulong",
	"unichar",
	"unowned",
	"ushort",
	"using",
	"var",
	"virtual",
	"void",
	"weak",
	"while",
	"yield",
	
	// types are not always named after the word
	
	"this_access",
	"type",
]);

export default class extends Lang {
	group = "vala";
	name = "Vala";
	defaultExtension = "vala";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"vala",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
