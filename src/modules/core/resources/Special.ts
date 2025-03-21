import {Resource} from "modules/core";
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
		return new Special(specialUrl("refactor-preview", pathToUrl(path)));
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