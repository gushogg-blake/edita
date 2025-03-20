import {Evented} from "utils";
import Resource from "./Resource";
import Format from "./Format";

import {
	getNewline,
	getIndent,
	guessLang,
} from "./utils";

export default abstract class FileLike extends Evented implements Resource {
	format: Format;
	
	updateFormat() {
		let {url, contents} = this;
		
		let indent = guessIndent(contents);
		let lang = guessLang(contents, url);
		let newline = getNewline(contents);
		
		this.format = new Format(newline, indent, lang);
	}
}
