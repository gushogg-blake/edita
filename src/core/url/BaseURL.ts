/*
base class for URLs

called BaseURL because FileLikeURL is already taken
*/

export default class BaseURL {
	private url: URL;
	
	private constructor(url: URL) {
		this.url = url;
	}
	
	get protocol() {
		return this.url.protocol;
	}
	
	toString() {
		return this.url.toString();
	}
	
	toJSON() {
		return this.toString();
	}
}
