import {URL, Format} from "modules/core";
import {getNewline, getIndent, guessLang} from "./utils";
import FileLike from "./FileLike";

export default class Memory extends FileLike {
	private constructor(url, str, lang=null) {
		super();
		
		this.url = url || URL.memory("memory");
		this.contents = str;
		
		let indent = getIndent(str);
		let newline = getNewline(str);
		
		if (!lang) {
			lang = guessLang(str, this.url);
		}
		
		this.format = new Format(newline, indent, lang);
	}
	
	protected updateFormat() {
	}
	
	static plain(str) {
		return new Memory(null, str);
	}
	
	static async withPath(path, str) {
		let file = new Memory(URL.file(path), str);
		
		await file.ensureRequiredLangsInitialised();
		
		return file;
	}
	
	static async withLang(str, lang) {
		let file = new Memory(null, str, lang);
		
		await file.ensureRequiredLangsInitialised();
		
		return file;
	}
}
