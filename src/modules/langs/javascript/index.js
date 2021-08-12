let astMode = require("./astMode");
let codeIntel = require("./codeIntel");
let parse = require("./parse");

let wordRe = /\w/;

module.exports = async function() {
	return {
		code: "javascript",
		name: "JavaScript",
		astMode,
		codeIntel,
		parse: await parse(),
		
		getHiliteClass(node) {
			let {type} = node;
			
			if ([
				"identifier",
				"property_identifier",
				"shorthand_property_identifier",
			].includes(type)) {
				return "id";
			}
			
			if (type === "comment") {
				return "comment";
			}
			
			if (type === "string" || type === "template_string") {
				return "string";
			}
			
			if (type === "number") {
				return "number";
			}
			
			if (type === "regex") {
				return "regex";
			}
			
			if ("(){}[]".includes(type) || type === "${") {
				return "bracket";
			}
			
			if (type[0].match(wordRe)) {
				return "keyword";
			}
			
			return "symbol";
		},
		
		getSupportLevel(code, path) {
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
		},
	};
}
