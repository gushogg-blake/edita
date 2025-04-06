import {Lang} from "core";

export default class extends Lang {
	group = "html";
	name = "HTML";
	defaultExtension = "html";
	possibleInjections = ["javascript", "typescript", "css", "scss", "sass"];
	
	injections = [
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
	];
	
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
