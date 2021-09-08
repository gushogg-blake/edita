let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

module.exports = {
	code: "php",
	name: "PHP",
	astMode,
	codeIntel,
	
	injections: [
		{
			pattern: "(text @injectionNode)",
			combined: true,
			lang: "html",
		},
	],
	
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
			"text",
			"raw_text",
			"quoted_attribute_value",
		].includes(type);
		
		let colour = [
			"comment",
			"quoted_attribute_value",
			"text",
			"raw_text",
		].includes(type);
		
		let renderAsText = [
			"quoted_attribute_value",
			"doctype",
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
	
	getOpenerAndCloser(node) {
		if ([
			"element",
			"style_element",
			"script_element",
		].includes(node.type)) {
			return {
				opener: node.firstChild,
				closer: node.lastChild,
			};
		}
		
		return null;
	},
	
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
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"php",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
};
