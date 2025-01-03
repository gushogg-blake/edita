let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

let lang = {
	group: "html",
	code: "markdown",
	name: "Markdown",
	defaultExtension: "md",
	astMode,
	codeIntel,
	possibleInjections: ["html", "markdown_inline", "typescript"],
	
	injections: [
		{
			pattern: "(inline) @injectionNode",
			lang: "markdown_inline",
			//combined: true,
			//excludeChildren: true,
		},
		
		{
			pattern: "(html_block) @injectionNode",
			lang: "html",
			combined: true,
		},
		
		{
			pattern: "(fenced_code_block (info_string (language) @langNode) (code_fence_content) @injectionNode)",
			
			lang({langNode}) {
				if (!langNode) {
					return null;
				}
				
				let langRef = langNode.text;
				let lang = base.langs.get(langRef);
				
				if (!lang) {
					lang = base.langs.all.find(lang => lang.defaultExtension === langRef);
				}
				
				return lang?.code || null;
			},
			
			combined: true,
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
		
		if (parent?.type.endsWith("_heading")) {
			return null;
		}
		
		if (type === "link") {
			return "link";
		}
		
		if (type.endsWith("_heading")) {
			return "heading";
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
