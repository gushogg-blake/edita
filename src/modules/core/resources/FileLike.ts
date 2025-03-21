import {Format, Resource} from "modules/core";
import {getNewline, getIndent, guessLang} from "./utils";

export default class FileLike extends Resource {
	contents: string;
	format: Format;
	
	protected updateFormat() {
		let {url, contents} = this;
		
		let indent = getIndent(contents);
		let lang = guessLang(contents, url);
		let newline = getNewline(contents);
		
		this.format = new Format(newline, indent, lang);
	}
	
	protected ensureRequiredLangsInitialised() {
		return base.ensureRequiredLangsInitialised(this.format.lang);
	}
	
	listen(fn) {
		return () => {}
	}
}

