import type {Resource, SpecialURL} from "core";

export default class Special implements Resource {
	declare url: SpecialURL;
	
	private constructor(type: string, path: string) {
		if (!path) {
			path = type;
		}
		
		this.url = FileLikeURL.special(type + ":", path);
	}
	
	static refactor(): Special {
		return new Special("refactor");
	}
	
	static refactorPreview(): Special {
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
