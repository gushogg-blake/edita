import {Resource, Format} from "modules/core/resources";
import {getNewline, getIndent, guessLang} from "./utils";

export default class Memory implements Resource {
	constructor(str, lang=null) {
		this.url = "memory://memory";
		this.contents = str;
		
		let indent = getIndent(str);
		let newline = getNewline(str);
		
		if (!lang) {
			lang = guessLang(str, this.url);
		}
		
		this.format = new Format(newline, indent, lang);
	}
}
