import type {Resource} from "core";
import URL, {pathToUrl} from "./URL";

export default class Special implements Resource {
	private constructor(type: string, path: string) {
		if (!path) {
			path = type;
		}
		
		this.url = URL.special(type + ":", path);
	}
	
	static refactor(): Special {
		return new Special("refactor");
	}
	
	static refactorPreview(path: string): Special {
		return new Special("refactor-preview");
	}
	
	static findAndReplace(): Special {
		return new Special("find-and-replace");
	}
	
	static clippings(): Special {
		return new Special("clippings");
	}
	
	static findResults(): Special {
		return new Special("find-results");
	}
}
