import {s, c} from "core";

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
	private constructor(url) {
		this.url = url;
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
	
	static file(path) {
		return CustomURL.fromString("file://" + pathToUrl(path));
	}
	
	static _new(path, startIndex=null, endIndex=null) {
		return CustomURL.fromString("new://" + pathToUrl(path));
	}
	
	static memory(path, startIndex=null, endIndex=null) {
		return CustomURL.fromString("memory://" + pathToUrl(path));
	}
	
	static fromString(str) {
		if (["file", "new", "memory"].includes(str.split(":")[0])) {
			return new FileLikeURL(new URL(str));
		} else {
			return new CustomURL(new URL(str));
		}
	}
	
	static special(protocol, path) {
		return CustomURL.fromString(protocol + "//" + path);
	}
	
	toString() {
		return this.url.toString();
	}
	
	toJSON() {
		return this.toString();
	}
}

function encodeSelection(selection) {
	let {left, right} = selection;
	
	return "#" + left.lineIndex + "," + left.offset + "-" + right.lineIndex + "," + right.offset;
}

class FileLikeURL extends CustomURL {
	constructor(url) {
		super(url);
		
		this.selection = this.parseSelection();
	}
	
	parseSelection() {
		let {hash} = this.url;
		
		if (!hash) {
			return null;
		}
		
		let [left, right] = hash.substr("#".length).split("-").map(function(str) {
			let [lineIndex, offset] = str.split(",").map(Number);
			
			return c(lineIndex, offset);
		});
		
		return s(left, right);
	}
	
	withSelection(selection) {
		let str = this.withoutSelection().toString() + encodeSelection(selection);
		
		return new FileLikeURL(new URL(str));
	}
	
	withoutSelection() {
		let url = new URL(this.toString());
		
		url.hash = "";
		
		return new CustomURL(url);
	}
	
	static fromString(str) {
		if (["file", "new", "memory"].includes(str.split(":")[0])) {
			return new FileLikeURL(new URL(str));
		} else {
			return new CustomURL(new URL(str));
		}
	}
	
	get path() {
		return urlToPath(this.url.pathname);
	}
	
	get name() {
		return platform.fs(this.path).name;
	}
}

export type {FileLikeURL};
