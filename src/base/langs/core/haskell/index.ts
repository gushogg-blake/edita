import {Lang} from "core";

let keywords = new Set([
	"as",
	"case",
	"of",
	"class",
	"data",
	"family",
	"instance",
	"default",
	"deriving",
	"do",
	"forall",
	"foreign",
	"hiding",
	"if",
	"then",
	"else",
	"import",
	"infix",
	"infixl",
	"infixr",
	"let",
	"in",
	"mdo",
	"module",
	"newtype",
	"proc",
	"qualified",
	"rec",
	"type",
	"where",
]);

export default class extends Lang {
	group = "haskell";
	name = "Haskell";
	defaultExtension = "hs";
	injections = [];
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"hs",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
