import {Evented} from "utils";
import nextName from "utils/nextName";
import URL from "modules/core/resources/URL";

let files = new WeakMap<URL, NewFile>();

export default class NewFile extends Evented implements Resource {
	constructor(url) {
		this.url = url;
	}
	
	static create(dir, lang) {
		let {defaultExtension} = lang;
		let extension = defaultExtension ? "." + defaultExtension : "";
		
		let name = nextName(function(n) {
			return lang.name + "-" + n + extension;
		}, function(name) {
			return !files.some(file => file.url.toString().endsWith("/" + name));
		});
		
		let path = platform.fs(dir).child(name).path;
		let url = URL._new(path);
		
		return new NewFile(url);
	}
}

