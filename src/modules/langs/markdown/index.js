let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

module.exports = {
	group: "html",
	code: "markdown",
	name: "Markdown",
	defaultExtension: "md",
	astMode,
	codeIntel,
	possibleInjections: ["html"],
	
	injections: [
		{
			pattern: "(html_block (text) @injectionNode)",
			lang: "html",
			combined: true,
		},
	],
	
	getFooter(node) {
		return null;
	},
	
	getHeader(node) {
		return null;
	},
	
	getHiliteClass(node) {
		let {
			type,
			parent,
		} = node;
		
		if (type === "link") {
			return "link";
		}
		
		return "text";
	},
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"md",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
};
