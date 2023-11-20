let lang = {
	code: "codepatterns",
	name: "CodePatterns Query",
	defaultExtension: "cp",
	possibleInjections: ["tsq"],
	
	injections: [
		{
			pattern: "(tsq) @injectionNode",
			combined: true,
			lang: "tsq",
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
		
		if (type === "regex") {
			return "regex";
		} else if (type === "lines") {
			return "lines";
		} else if (type === "captureLabel") {
			return "captureLabel";
		}
		
		return "literal";
	},
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"cp",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
};

module.exports = lang;
