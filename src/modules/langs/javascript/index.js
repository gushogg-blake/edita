let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

let wordRe = /\w/;

let lang = {
	group: "javascript",
	code: "javascript",
	name: "JavaScript",
	defaultExtension: "js",
	astMode,
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
		
		/*
		if a node can contain tabs, we just set the hilite colour and then
		render the contents as a string.
		
		this allows the tabs to be handled by the variableWidthParts logic
		
		having tabs in nodes in renderHints would break the logic, as the
		nodes wouldn't line up with the variable width parts.
		*/
		
		/*
		canIncludeTabs/colour = these are separate because regexes are
		composed of multiple parts.  the "regex" is the outermost node, so
		we set the colour when we see that.  then there's a syntax node for
		the opening /, then a regex_pattern for the actual pattern -- this
		is the bit that can contain tabs.
		*/
		
		let canIncludeTabs = [
			"comment",
			"string",
			"template_string",
			"regex_pattern",
		].includes(type);
		
		let colour = [
			"comment",
			"string",
			"template_string",
			"regex",
		].includes(type);
		
		let renderAsText = [
			"string",
			"template_string",
			"regex",
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
			
			/*
			reset colour to string after template string interpolation
			*/
			
			if (type === "}" && parent?.type === "template_substitution") {
				yield {
					lang: this,
					node: parent.parent, // the template_string node, which is just used for selecting the colour
					offset: endPosition.column,
				};
			}
		}
	},
	
	isBlock(node) {
		return node.startPosition.row !== node.endPosition.row && [
			"object",
			"array",
			"parenthesized_expression", // includes if condition brackets
			"arguments",
			"statement_block",
			"class_body",
			"template_string",
			"variable_declarator",
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
	
	getOpenerAndCloser(node) {
		if ([
			"object",
			"array",
			"parenthesized_expression", // includes if condition brackets
			"statement_block",
			"class_body",
			"template_string",
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
			"identifier",
			"property_identifier",
			"shorthand_property_identifier",
			"shorthand_property_identifier_pattern",
			"statement_identifier",
		].includes(type)) {
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
	
	commentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		let minIndentLevel = Math.min(...lines.map(line => line.indentLevel));
		let minIndent = document.fileDetails.indentation.string.repeat(minIndentLevel);
		
		return lines.map(function(line) {
			return line.string.replace(new RegExp("^" + minIndent), minIndent + "//");
		}).join(document.fileDetails.newline);
	},
	
	uncommentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		
		return lines.map(function(line) {
			return line.string.replace(/^(\s*)(\/\/)?/, "$1");
		}).join(document.fileDetails.newline);
	},
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		 if ([
			"js",
			"cjs",
			"es",
			"es6",
			"mjs",
			"jsx",
		].includes(type)) {
			return "general";
		}
		
		if ([
			"json",
			"json5",
		].includes(type)) {
			return "alternate";
		}
		
		return null;
	},
};

lang.codeIntel = codeIntel(lang);

module.exports = lang;
