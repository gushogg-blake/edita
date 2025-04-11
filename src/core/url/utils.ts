import {type Selection, s, c} from "core";

/*
convert URL-style paths (always /, can some chars will be URL
encoded) to and from filesystem paths (separator platform dependent,
no URL-encoded chars)
*/

export function pathToUrl(path: string): string {
	let encoded = "/" + path.split("/").slice(1).map(p => encodeURIComponent(p)).join("/");
	
	if (platform.isWindows) {
		return "/" + encoded.replaceAll("\\", "/").toLowerCase();
	} else {
		return encoded;
	}
}

export function urlToPath(urlPath: string): string {
	let decoded = "/" + urlPath.split("/").slice(1).map(p => decodeURIComponent(p)).join("/");
	
	if (platform.isWindows) {
		return decoded.substr(1).replaceAll("/", "\\");
	} else {
		return decoded;
	}
}

/*
convert between a Selection and our scheme for encoding it in the
hash part of the URL

(for FileLikeURLs only)
*/

export function decodeSelection(hash: string): Selection | null {
	if (!hash.match(/^#\d+,\d+-\d+,\d+$/)) {
		return null;
	}
	
	let [left, right] = hash.substr("#".length).split("-").map(function(str) {
		let [lineIndex, offset] = str.split(",").map(Number);
		
		return c(lineIndex, offset);
	});
	
	return s(left, right);
}

export function encodeSelection(selection: Selection): string {
	let {left, right} = selection;
	
	return "#" + left.lineIndex + "," + left.offset + "-" + right.lineIndex + "," + right.offset;
}
