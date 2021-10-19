let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

let loggedTypes = [];

let wordRe = /\w/;

module.exports = {
	code: "c",
	name: "C",
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
			"string",
		].includes(type);
		
		let colour = [
			"comment",
			"string",
		].includes(type);
		
		let renderAsText = [
			
		].includes(parent?.type);
		
		if (!loggedTypes.includes(type)) {
			console.log(type);
			loggedTypes.push(type);
		}
		
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
		let {type} = node;
		
		if ([
			"identifier",
			"field_identifier",
		].includes(type)) {
			return "id";
		}
		
		if ([
			"type_identifier",
		].includes(type)) {
			return "type";
		}
		
		if (type === "#include") {
			return "include";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		if (["string_literal", "\""].includes(type)) {
			return "string";
		}
		
		if (type === "integer" || type === "float") {
			return "number";
		}
		
		if (type[0].match(wordRe)) {
			return "keyword";
		}
		
		return "symbol";
	},
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"c",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
};
