let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

module.exports = {
	code: "html",
	name: "HTML",
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
			&& startPosition.row === endPosition.row
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
	
	getInjectionLang(node) {
		let {
			type,
			parent,
		} = node;
		
		if (!parent || type !== "raw_text") {
			return null;
		}
		
		if (parent.type === "style_element") {
			return "css";
		}
		
		if (parent.type === "script_element") {
			return "javascript";
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
			"html",
			"htm",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
};
