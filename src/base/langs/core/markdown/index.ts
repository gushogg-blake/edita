import {Lang} from "core";

export default class extends Lang {
	group = "html";
	name = "Markdown";
	defaultExtension = "md";
	possibleInjections = ["html", "markdown_inline", "typescript"];
	
	injections = [
		{
			pattern: "(inline) @injectionNode",
			lang: "markdown_inline",
			/*
			excludeChildren was added to support markdown as inline nodes -- where
			markdown_inline is injected -- can contain children, which doesn't make
			sense (can't remember but this probably resulted in a bug where certain
			chars were rendered twice because both the markdown and markdown_inline
			parsers were rendering them -- [] and () seem to be examples, e.g. in
			a heading like # heading with [a link](...))
			
			the WASM is from https://github.com/MDeiml/tree-sitter-markdown/ which
			now redirects to https://github.com/tree-sitter-grammars/tree-sitter-markdown
			
			the new version doesn't have a tree-sitter.json so keeping the legacy one
			for now -- this may have been fixed in the latest version
			*/
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
	];
	
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
	}
}
