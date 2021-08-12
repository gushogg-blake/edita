let astMode = require("./astMode");
let codeIntel = require("./codeIntel");
let parse = require("./parse");

module.exports = async function() {
	return {
		code: "html",
		name: "HTML",
		astMode,
		codeIntel,
		parse: await parse(),
		
		getHiliteClass(node) {
			let {type} = node;
			
			if ([
				"<",
				">",
				"/>",
				"</",
				"tag_name",
			].includes(type)) {
				return "tag";
			}
			
			if (type === "attribute_name") {
				return "attribute";
			}
			
			if (type === "quoted_attribute_value") {
				return "string";
			}
			
			return "text";
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
