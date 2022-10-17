let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

module.exports = {
	group: "html",
	code: "svelte",
	name: "Svelte",
	defaultExtension: "svelte",
	astMode,
	codeIntel,
	possibleInjections: ["javascript", "css"],
	injections: [],
	
	getHiliteClass(node, nodeUtils) {
		// TODO
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
