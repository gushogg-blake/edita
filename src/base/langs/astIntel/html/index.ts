import {Lang} from "core";

export default class extends Lang {
	group = "html";
	code = "html";
	name = "HTML";
	defaultExtension = "html";
	possibleInjections: ["javascript", "typescript", "css", "scss", "sass"],
	
	injections: [
		{
			pattern: "(script_element (raw_text) @injectionNode)",
			
			lang({injectionNode}) {
				let lang = "javascript";
				
				let startTag = injectionNode.parent.firstChild;
				let [, ...attributes] = startTag.namedChildren;
				let langAttribute = attributes.find(a => a.text.match(/^lang=/));
				
				if (langAttribute?.text.match(/^lang=["']?(ts|typescript)/)) {
					lang = "typescript";
				}
				
				return lang;
			},
		},
		{
			pattern: "(style_element (raw_text) @injectionNode)",
			
			lang({injectionNode}) {
				let lang;
				
				let startTag = injectionNode.parent.firstChild;
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
			
			&& node.firstChild.end.lineIndex !== node.lastChild.start.lineIndex
		);
	}
	
	getFooter(node) {
		let {parent} = node;
		
		if (
			node.type === "start_tag"
			&& this.isElementBlock(parent)
		) {
			return parent.lastChild;
		}
		
		return null;
	}
	
	getHeader(node) {
		let {parent} = node;
		
		if (
			node.type === "end_tag"
			&& this.isElementBlock(parent)
		) {
			return parent.firstChild;
		}
		
		return null;
	}
	
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
		
		if (type === "xml") {
			return "alternate";
		}
		
		return null;
	}
}
