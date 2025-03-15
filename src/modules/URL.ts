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
	constructor(url) {
		if (url instanceof CustomURL) {
			url = url.toString();
		}
		
		this.url = new URL(url);
	}
	
	get path() {
		return urlToPath(this.url.pathname);
	}
	
	get protocol() {
		let {protocol} = this.url;
		
		return protocol.substr(0, protocol.length - 1);
	}
	
	get isNew() {
		return this.protocol === "new";
	}
	
	get isFile() {
		return this.protocol === "file";
	}
	
	static file(path) {
		return new CustomURL("file://" + pathToUrl(path));
	}
	
	static _new(path) {
		return new CustomURL("new://" + pathToUrl(path));
	}
	
	toString() {
		return this.url.toString();
	}
	
	toJSON() {
		return this.toString();
	}
}

module.exports = CustomURL;
