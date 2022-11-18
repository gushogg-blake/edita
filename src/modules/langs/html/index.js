let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

module.exports = {
	group: "html",
	code: "html",
	name: "HTML",
	astMode,
	codeIntel,
	possibleInjections: ["javascript", "css", "scss", "sass"],
	defaultExtension: "html",
	
	injections: [
		{
			pattern: "(script_element (raw_text) @injectionNode)",
			
			lang(captures) {
				return "javascript";
			},
		},
		{
			pattern: "(style_element (raw_text) @injectionNode)",
			
			lang(captures) {
				let lang;
				
				let startTag = captures.injectionNode.parent.firstChild;
				let [, ...attributes] = startTag.namedChildren;
				let langAttribute = attributes.find(a => a.text.match(/^lang=/));
				let typeAttribute = attributes.find(a => a.text.match(/^type=/));
				
				if (langAttribute) {
					lang = langAttribute.text.match(/^lang=["'](scss|sass)/)?.[1];
				} else if (typeAttribute) {
					lang = typeAttribute.text.match(/^type=["']text\/(scss|sass)/)?.[1];
				}
				
				return lang || "css";
			},
		},
	],
	
	isElementBlock(node) {
		return (
			[
				"element",
				"style_element",
				"script_element",
			].includes(node.type)
			
			&& node.firstChild.endPosition.row !== node.lastChild.startPosition.row
		);
	},
	
	getFooter(node) {
		let {parent} = node;
		
		if (
			node.type === "start_tag"
			&& this.isElementBlock(parent)
		) {
			return parent.lastChild;
		}
		
		return null;
	},
	
	getHeader(node) {
		let {parent} = node;
		
		if (
			node.type === "end_tag"
			&& this.isElementBlock(parent)
		) {
			return parent.firstChild;
		}
		
		return null;
	},
	
	getHiliteClass(node) {
		let {
			type,
			parent,
		} = node;
		
		if ([
			"quoted_attribute_value",
			"doctype",
		].includes(parent?.type)) {
			return null;
		}
		
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
		
		if (type === "comment") {
			return "comment";
		}
		
		return "text";
	},
	
	commentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		let minIndentLevel = Math.min(...lines.map(line => line.indentLevel));
		let minIndent = document.fileDetails.indentation.string.repeat(minIndentLevel);
		
		return lines.map(function(line) {
			return line.string.replace(new RegExp("^" + minIndent), minIndent + "<!--") + "-->";
		}).join(document.fileDetails.newline);
	},
	
	uncommentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		
		return lines.map(function(line) {
			return line.string.replace(/^(\s*)(<!--)?/, "$1").replace(/-->$/, "");
		}).join(document.fileDetails.newline);
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
