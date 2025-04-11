import {BaseURL} from ".";

export default class SpecialURL extends BaseURL {
	private constructor(url: URL) {
		super(url);
	}
	
	static fromString(str: string): SpecialURL {
		return new SpecialURL(new URL(str));
	}
	
	static special(protocol: string, path: string): SpecialURL {
		return SpecialURL.fromString(protocol + "//" + path);
	}
}
