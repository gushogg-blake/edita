let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

module.exports = {
	code: "css",
	name: "CSS",
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
			yield{
				type: "colour",
				offset: startOffset,
				lang,
				node,
			};
		}
		
		if (
			!canIncludeTabs
			&& !renderAsText
			&& childCount === 0
			&& startPosition.row !== endPosition.row
		) {
			yield {
				type: "node",
				offset: startOffset,
				lang,
				node,
			};
		}
	},
	
	getOpenerAndCloser(node) {
		if ([
			"block",
		].includes(type)) {
			return {
				opener: node.firstChild,
				closer: node.lastChild,
			};
		}
		
		return null;
	},
	
	getInjectionLang(node) {
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
