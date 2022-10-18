let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

module.exports = {
	group: "css",
	code: "scss",
	name: "SCSS",
	defaultExtension: "scss",
	astMode,
	codeIntel,
	injections: [],
	
	isBlock(node) {
		return node.startPosition.row !== node.endPosition.row && [
			"block",
		].includes(node.type);
	},
	
	getFooter(node) {
		let {parent} = node;
		
		if (
			parent
			&& this.isBlock(parent)
			&& node.id === parent.firstChild.id
		) {
			return parent.lastChild;
		}
		
		return null;
	},
	
	getHeader(node) {
		let {parent} = node;
		
		if (
			parent
			&& this.isBlock(parent)
			&& node.id === parent.lastChild.id
		) {
			return parent.firstChild;
		}
		
		return null;
	},
	
	getHiliteClass(node, nodeUtils) {
		let {type} = node;
		let parent = nodeUtils.parent(node);
		
		if ([
			"string_value",
			"integer_value",
			"float_value",
		].includes(parent?.type)) { //
			return null;
		}
		
		if (type === "tag_name") {
			return "tagName";
		}
		
		if (type === "class_name") {
			return "className";
		}
		
		if (type === "id_name" || type === "#" && parent?.type === "id_selector") {
			return "idName";
		}
		
		if (type === "property_name") {
			return "property";
		}
		
		if (type === "string_value") {
			return "string";
		}
		
		if (type === "color_value") {
			return "color";
		}
		
		if (type === "float_value" || type === "integer_value") {
			return "number";
		}
		
		if (type === "plain_value") {
			return "text";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		return "symbol";
	},
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"scss",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
}
