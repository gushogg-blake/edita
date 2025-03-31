import {Resource} from "core";
import URL, {pathToUrl} from "./URL";

export default class Special extends Resource {
	private constructor(type, path) {
		super();
		
		if (!path) {
			path = type;
		}
		
		this.url = URL.special(type + ":", path);
	}
	
	static refactor() {
		return new Special("refactor");
	}
	
	static refactorPreview(path) {
		return new Special("refactor-preview");
	}
	
	static findAndReplace() {
		return new Special("find-and-replace");
	}
	
	static clippings() {
		return new Special("clippings");
	}
	
	static findResults() {
		return new Special("find-results");
	}
}
