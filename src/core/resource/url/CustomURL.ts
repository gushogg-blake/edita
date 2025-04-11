/*
base class for URLs

called CustomURL because URL is already taken
*/

export default class CustomURL {
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
