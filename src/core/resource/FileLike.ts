import {Evented} from "utils";
import type {FileLikeURL, Resource} from "core";
import {Format, Lang} from "core";
import {getNewline, getIndent, guessLang} from "./utils";

export default class FileLike extends Evented<{
	formatChanged: void;
}> implements Resource {
	declare url: FileLikeURL;
	
	format: Format;
	contents: string;
	
	constructor(url: FileLikeURL) {
		super();
		
		this.url = url;
	}
	
	setLang(lang: Lang) {
		this.format.lang = lang;
		
		this.fire("formatChanged");
	}
	
	protected updateFormat(): void {
		let hasFormat = !!this.format;
		
		let {url, contents} = this;
		
		let indent = getIndent(contents);
		let lang = guessLang(contents, url);
		let newline = getNewline(contents);
		
		this.format = new Format(newline, indent, lang);
		
		if (hasFormat) {
			this.fire("formatChanged");
		}
	}
	
	protected ensureRequiredLangsInitialised(): Promise<void> {
		return base.ensureRequiredLangsInitialised(this.format.lang);
	}
	
	/*
	file watching is handled separately to events so we can add/remove
	the underlying watcher as necessary (we could override Evented but
	this way seems cleaner)
	*/
	
	watch(fn) {
		return () => {}
	}
}
