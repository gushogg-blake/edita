let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

let wordRe = /\w/;

module.exports = {
	code: "javascript",
	name: "JavaScript",
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
		
		let startOffset = startPosition.column;
		
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
		
		renderAsText is for the children of regexes and strings (e.g. opening
		and closing delims).  not having nodes for these allows the render
		logic to break as soon as it encounters a node when looking for the
		previous colour hint (otherwise the closing quote would cause subsequent
		text to be coloured as a string) (see renderCodeAndMargin); and also
		means we don't need to specify colours for these chars.
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
				type: "colour",
				offset: startOffset,
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
				type: "node",
				offset: startOffset,
				lang: this,
				node,
			};
			
			/*
			reset colour to string after template string interpolation
			*/
			
			if (node.type === "}" && parent?.type === "template_substitution") {
				yield {
					type: "colour",
					offset: startOffset + 1,
					lang: this,
					node: parent.parent, // the template_string node, which is just used for selecting the colour
				};
			}
		}
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
	
	getInjectionLang(node) {
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
