let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

let lang = {
	group: "html",
	code: "markdown",
	name: "Markdown",
	defaultExtension: "md",
	astMode,
	codeIntel,
	possibleInjections: ["html"],
	
	injections: [
		{
			pattern: "(html_block (text) @injectionNode)",
			lang: "html",
			combined: true,
		},
		
		{
			pattern: "(fenced_code_block (info_string (text) @lang) (code_fence_content (text) @injectionNode))",
			
			lang({lang}) {
				return lang.text;
			},
			
			combined: false,
		},
	],
	
	getFooter(node) {
		return null;
	},
	
	getHeader(node) {
		return null;
	},
	
	getHiliteClass(node) {
		let {
			type,
			parent,
		} = node;
		
		if (type === "link") {
			return "link";
		}
		
		return "text";
	},
	
	commentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		let minIndentLevel = Math.min(...lines.map(line => line.indentLevel));
		let minIndent = document.format.indentation.string.repeat(minIndentLevel);
		
		return lines.map(function(line) {
			return line.string.replace(new RegExp("^" + minIndent), minIndent + "<!--") + "-->";
		}).join(document.format.newline);
	},
	
	uncommentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		
		return lines.map(function(line) {
			return line.string.replace(/^(\s*)(<!--)?/, "$1").replace(/-->$/, "");
		}).join(document.format.newline);
	},
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"md",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
};

module.exports = lang;
