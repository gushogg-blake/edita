let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

module.exports = {
	code: "php",
	name: "PHP",
	astMode,
	codeIntel,
	
	injections: [
		{
			pattern: "(text) @injectionNode",
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
			"string",
		].includes(type);
		
		let colour = [
			"comment",
			"string",
		].includes(type);
		
		let renderAsText = [
			
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
			"$",
			"name",
		].includes(type)) {
			return "id";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		if (type === "string") {
			return "string";
		}
		
		if (type === "integer" || type === "float") {
			return "number";
		}
		
		if (["php_tag", "?>"].includes(type)) {
			return "phpTag";
		}
		
		return "symbol";
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
