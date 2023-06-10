function pathToUrl(path) {
	if (platform.isWindows) {
		return "/" + path.replaceAll("\\", "/").toLowerCase();
	} else {
		return path;
	}
}

function urlToPath(urlPath) {
	if (platform.isWindows) {
		return urlPath.substr(1).replaceAll("/", "\\");
	} else {
		return urlPath;
	}
}

class URL {
	constructor(url) {
		if (url instanceof URL) {
			url = url.toString();
		}
		
		this.url = url;
	}
	
	get path() {
		return urlToPath(this.url.substr(this.url.indexOf("://") + 3));
	}
	
	get protocol() {
		return this.url.substr(0, this.url.indexOf(":"));
	}
	
	get isNew() {
		return this.protocol === "new";
	}
	
	get isFile() {
		return this.protocol === "file";
	}
	
	static file(path) {
		return new URL("file://" + pathToUrl(path));
	}
	
	static _new(path) {
		return new URL("new://" + pathToUrl(path));
	}
	
	toString() {
		return this.url;
	}
	
	toJSON() {
		return this.toString();
	}
}

module.exports = URL;
