let lang = {
	code: "codepatterns",
	name: "CodePatterns Query",
	defaultExtension: "cp",
	reparseOnEdit: true, // HACK
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
		
		if ([
			"regex",
			"captureLabel",
		].includes(parent?.type)) {
			return null;
		}
		
		if (type === "captureLabel") {
			let prevNonEmptySibling = null;
			let prevSibling = node.previousSibling;
			
			while (prevSibling) {
				if (prevSibling.text.trim() !== "") {
					prevNonEmptySibling = prevSibling;
					
					break;
				}
				
				prevSibling = prevSibling.previousSibling;
			}
			
			let prevType = prevNonEmptySibling?.type;
			
			if (["regex", "lineQuantifier", "tsq"].includes(prevType)) {
				return "captureLabel";
			} else {
				return "literal";
			}
		}
		
		if (type.match(/\w/)) {
			return type;
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

export default lang;
