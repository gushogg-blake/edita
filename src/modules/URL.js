let lid = require("utils/lid");

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
		
		this.url = new window.URL(url);
	}
	
	get path() {
		return urlToPath(this.url.pathname);
	}
	
	get protocol() {
		return this.url.protocol.replace(/:$/, "");
	}
	
	static file(path) {
		return new URL("file://" + pathToUrl(path));
	}
	
	static _new(path) {
		return new URL("new://" + pathToUrl(path));
	}
	
	static virtual(path) {
		return new URL("virtual://" + pathToUrl(path) + "-" + lid());
	}
	
	toString() {
		return this.url.toString();
	}
	
	toJSON() {
		return this.toString();
	}
}

module.exports = URL;
