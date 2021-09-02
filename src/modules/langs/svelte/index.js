let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

module.exports = {
	code: "svelte",
	name: "Svelte",
	astMode,
	codeIntel,
	
	*generateRenderHints(node) {
		let {
			type,
			startPosition,
			endPosition,
			parent,
			childCount,
		} = node;
		
		let startOffset = startOffset.column;
		
		// TODO
	},
	
	getOpenerAndCloser(node) {
		return null; // TODO
	},
	
	getInjectionLang(node) {
		return null; // TODO
	},
		
	getHiliteClass(node) {
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
