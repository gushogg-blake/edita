function pathToUrl(path) {
	let encoded = "/" + path.split("/").slice(1).map(p => encodeURIComponent(p)).join("/");
	
	if (platform.isWindows) {
		return "/" + encoded.replaceAll("\\", "/").toLowerCase();
	} else {
		return encoded;
	}
}

function urlToPath(urlPath) {
	let decoded = "/" + urlPath.split("/").slice(1).map(p => decodeURIComponent(p)).join("/");
	
	if (platform.isWindows) {
		return decoded.substr(1).replaceAll("/", "\\");
	} else {
		return decoded;
	}
}

class CustomURL {
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
		return CustomURL.fromString("file://" + pathToUrl(path));
	}
	
	static _new(path) {
		return CustomURL.fromString("new://" + pathToUrl(path));
	}
	
	toString() {
		return this.url.toString();
	}
	
	toJSON() {
		return this.toString();
	}
}

export default CustomURL;
