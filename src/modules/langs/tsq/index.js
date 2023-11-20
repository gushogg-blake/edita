let lang = {
	group: "lisp",
	code: "tsq",
	name: "Tree-sitter Query",
	defaultExtension: "tsq",
	
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
			"tsq",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
};

module.exports = lang;
