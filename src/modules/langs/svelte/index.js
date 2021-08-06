let codeIntel = require("./codeIntel");
let parse = require("./parse");

module.exports = async function() {
	return {
		code: "svelte",
		name: "Svelte",
		codeIntel,
		parse: await parse(),
		
		getHiliteClass(node) {
			
		},
		
		getSupportLevel(code, path) {
			let type = platform.fs(path).lastType;
			
			if ([
				"svelte",
			].includes(type)) {
				return "specific";
			}
			
			if ([
				"html",
			].includes(type)) {
				return "alternate";
			}
			
			return null;
		},
	};
}
