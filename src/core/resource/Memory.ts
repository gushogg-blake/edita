import {FileLikeURL, Format, type Lang} from "core";
import {getNewline, getIndent, guessLang} from "./utils";
import FileLike from "./FileLike";

export default class Memory extends FileLike {
	private constructor(url: FileLikeURL, str: string, lang: Lang = null) {
		super(url || FileLikeURL.memory("memory"));
		
		this.contents = str;
		
		let indent = getIndent(str);
		let newline = getNewline(str);
		
		if (!lang) {
			lang = guessLang(str, this.url);
		}
		
		this.format = new Format(newline, indent, lang);
	}
	
	protected updateFormat(): void {
	}
	
	static plain(str: string): Memory {
		return new Memory(null, str);
	}
	
	static async withPath(path: string, str: string): Promise<Memory> {
		let file = new Memory(FileLikeURL.file(path), str);
		
		await file.ensureRequiredLangsInitialised();
		
		return file;
	}
	
	static async withLang(str: string, lang: Lang): Promise<Memory> {
		let file = new Memory(null, str, lang);
		
		await file.ensureRequiredLangsInitialised();
		
		return file;
	}
}
