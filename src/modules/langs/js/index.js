let codeIntel = require("./codeIntel");
let parse = require("./parse");

let wordRe = /\w/;

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
			
			if (type === "string" || type === "template_string") {
				return "string";
			}
			
			if (type === "number") {
				return "number";
			}
			
			if (type === "regex") {
				return "regex";
			}
			
			if ("(){}[]".includes(type) || type === "${") {
				return "bracket";
			}
			
			if (type[0].match(wordRe)) {
				return "keyword";
			}
			
			return "symbol";
		},
		
		/*
		e.g. block comments, template strings
		
		these are added to a line's nodes as they don't have children, but because
		they can be multiline, we can't render them by just rendering their text
		onto the current line.  instead we render the first char of them (which
		will be on the current line) and then render the rest as misc text
		*/
		
		isChildlessMultiline(node) {
			return node.startPosition.row !== node.endPosition.row && node.childCount === 0;
		},
	};
}
