export default class extends Lang {
	group = "html"; // to get snippets
	code = "markdown_inline";
	name = "markdown_inline (sub-parser for markdown)";
	util: true,
	
	injections: [
		{
			pattern: "(html_tag) @injectionNode",
			lang: "html",
			combined: false,
		},
	],
	
	getFooter(node) {
		return null;
	}
	
	getHeader(node) {
		return null;
	}
	
	getHiliteClass(node) {
		let {
			type,
			parent,
		} = node;
		
		if ([
			"inline_link",
			"shortcut_link",
		].includes(type)) {
			return "link";
		}
		
		return null;
	}
	
	commentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		let minIndentLevel = Math.min(...lines.map(line => line.indentLevel));
		let minIndent = document.format.indentation.string.repeat(minIndentLevel);
		
		return lines.map(function(line) {
			return line.string.replace(new RegExp("^" + minIndent), minIndent + "<!--") + "-->";
		}).join(document.format.newline);
	}
	
	uncommentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		
		return lines.map(function(line) {
			return line.string.replace(/^(\s*)(<!--)?/, "$1").replace(/-->$/, "");
		}).join(document.format.newline);
	}
	
	getSupportLevel(code, path) {
		return null;
	}
}
