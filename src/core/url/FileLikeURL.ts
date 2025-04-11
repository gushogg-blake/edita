import type {Selection} from "core";
import {BaseURL} from ".";
import {encodeSelection, decodeSelection} from "./utils";

class FileLikeURL extends BaseURL {
	selection: Selection | null;
	
	constructor(url: URL) {
		super(url);
		
		this.selection = this.parseSelection();
	}
	
	parseSelection(): Selection | null {
		let {hash} = this.url;
		
		return hash ? decodeSelection(hash) : null;
	}
	
	withSelection(selection: Selection): FileLikeURL {
		let str = this.withoutSelection().toString() + encodeSelection(selection);
		
		return new FileLikeURL(new FileLikeURL(str));
	}
	
	withoutSelection(): FileLikeURL {
		let url = new URL(this.toString());
		
		url.hash = "";
		
		return new FileLikeURL(url);
	}
	
	get isNew() {
		return this.protocol === "new:";
	}
	
	get isFile() {
		return this.protocol === "file:";
	}
	
	get path() {
		return urlToPath(this.url.pathname);
	}
	
	get name() {
		return platform.fs(this.path).name;
	}
	
	static file(path: string): FileLikeURL {
		return FileLikeURL.fromString("file://" + pathToUrl(path));
	}
	
	static _new(path: string): FileLikeURL {
		return FileLikeURL.fromString("new://" + pathToUrl(path));
	}
	
	static memory(path: string): FileLikeURL {
		return FileLikeURL.fromString("memory://" + pathToUrl(path));
	}
	
	static fromString(str: string): FileLikeURL {
		return new FileLikeURL(new URL(str));
	}
}
