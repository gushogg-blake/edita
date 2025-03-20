import {Evented} from "utils";
import nextName from "utils/nextName";

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
		
		//let dir = this.selectedProject?.dirs[0].path || platform.systemInfo.homeDir;
		let path = platform.fs(dir).child(name).path;
		
		let tab = await this.app.mainTabs.newFile(URL._new(path), format);
	}
}

