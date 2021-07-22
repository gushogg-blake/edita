let codeIntel = require("./codeIntel");
let parse = require("./parse");

module.exports = async function() {
	return {
		code: "js",
		codeIntel,
		parse: await parse(),
		
		getHiliteClass(node) {
			let {type} = node;
			
			if (type === "identifier" || type === "property_identifier") {
				return "id";
			}
			
			if (type === "comment") {
				return "comment";
			}
			
			if ("\"'".includes(type)) {
				return "string";
			}
			
			if (type === "number") {
				return "number";
			}
			
			if (type === "regex_pattern") {
				return "regex";
			}
			
			if ("(){}[]".includes(type)) {
				return "bracket";
			}
			
			if (type.match(/\w+/)) {
				return "keyword";
			}
			
			return "symbol";
		},
	};
}
