let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

module.exports = {
	code: "css",
	name: "CSS",
	astMode,
	codeIntel,
	injections: [],
	
	*generateRenderHints(node) {
		let {
			type,
			startPosition,
			endPosition,
			parent,
			childCount,
			text,
		} = node;
		
		let canIncludeTabs = [
			"comment",
			"string_value",
		].includes(type);
		
		let colour = [
			"comment",
			"string_value",
			"integer_value",
			"float_value",
		].includes(type);
		
		let renderAsText = [
			"string_value",
			"integer_value",
			"float_value",
		].includes(parent?.type);
		
		if (colour) {
			yield {
				lang: this,
				node,
			};
		}
		
		if (
			!canIncludeTabs
			&& !renderAsText
			&& childCount === 0
			&& startPosition.row === endPosition.row
		) {
			yield {
				lang: this,
				node,
				string: text,
			};
		}
	},
	
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
	
	getHiliteClass(node) {
		let {type, parent} = node;
		
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
			return "colour";
		}
		
		if (type === "float_value" || type === "integer_value") {
			return "number";
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
			"css",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
}
