export function pathToUrl(path) {
	let encoded = "/" + path.split("/").slice(1).map(p => encodeURIComponent(p)).join("/");
	
	if (platform.isWindows) {
		return "/" + encoded.replaceAll("\\", "/").toLowerCase();
	} else {
		return encoded;
	}
}

export function urlToPath(urlPath) {
	let decoded = "/" + urlPath.split("/").slice(1).map(p => decodeURIComponent(p)).join("/");
	
	if (platform.isWindows) {
		return decoded.substr(1).replaceAll("/", "\\");
	} else {
		return decoded;
	}
}

/*
we can use #123 or #123-456 to indicate a position or range in a
file (chracter offset-based)
*/

function positionOrRange(startIndex, endIndex) {
	if (startIndex !== null && endIndex !== null) {
		return "#" + startIndex + "-" + endIndex;
	} else if (startIndex !== null) {
		return "#" + startIndex;
	} else {
		return "";
	}
}

export default class CustomURL {
	private constructor(str) {
		this.url = new URL(str);
	}
	
	get path() {
		return urlToPath(this.url.pathname);
	}
	
	get name() {
		return platform.fs(this.path).name;
	}
	
	get protocol() {
		return this.url.protocol;
	}
	
	get isNew() {
		return this.protocol === "new:";
	}
	
	get isFile() {
		return this.protocol === "file:";
	}
	
	static file(path, startIndex=null, endIndex=null) {
		return new CustomURL("file://" + pathToUrl(path) + positionOrRange(startIndex, endIndex));
	}
	
	static _new(path, startIndex=null, endIndex=null) {
		return new CustomURL("new://" + pathToUrl(path) + positionOrRange(startIndex, endIndex));
	}
	
	static memory(path, startIndex=null, endIndex=null) {
		return new CustomURL("memory://" + pathToUrl(path) + positionOrRange(startIndex, endIndex));
	}
	
	static fromString(str) {
		return new CustomURL(str);
	}
	
	static special(protocol, path) {
		return new CustomURL(protocol + "//" + path);
	}
	
	toString() {
		return this.url.toString();
	}
	
	toJSON() {
		return this.toString();
	}
}
