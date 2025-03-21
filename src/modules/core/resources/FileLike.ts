import {Evented} from "utils";
import {type Resource, Format} from "modules/core/resources";
import {getNewline, getIndent, guessLang} from "./utils";

export default abstract class FileLike extends Evented implements Resource {
	updateFormat() {
		let {url, contents} = this;
		
		let indent = getIndent(contents);
		let lang = guessLang(contents, url);
		let newline = getNewline(contents);
		
		this.format = new Format(newline, indent, lang);
	}
	
	listen() {
		return () => {}
	}
}
