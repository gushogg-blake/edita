let astMode = require("./astMode");
let codeIntel = require("./codeIntel");
let parse = require("./parse");

module.exports = async function() {
	return {
		code: "html",
		name: "HTML",
		astMode,
		astMode,
		parse: await parse(),
		
		getHiliteClass(node) {
			
		},
		
		getSupportLevel(code, path) {
			let type = platform.fs(path).lastType;
			
			if ([
				"html",
				"htm",
			].includes(type)) {
				return "general";
			}
			
			return null;
		},
	};
}
