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

export default class CustomURL {
	constructor(str) {
		this.url = new URL(str);
	}
	
	get path() {
		return urlToPath(this.url.pathname);
	}
	
	get protocol() {
		let {protocol} = this.url;
		
		return protocol.substr(0, protocol.length - 1);
	}
	
	get isNew() {
		return this.protocol === "new:";
	}
	
	get isFile() {
		return this.protocol === "file:";
	}
	
	static file(path) {
		return new CustomURL("file://" + pathToUrl(path));
	}
	
	static _new(path) {
		return new CustomURL("new://" + pathToUrl(path));
	}
	
	static memory(path) {
		return new CustomURL("memory://" + pathToUrl(path));
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
