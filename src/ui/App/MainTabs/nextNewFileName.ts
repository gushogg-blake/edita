import nextName from "utils/nextName";
import {type Lang, URL} from "modules/core";

export default function(editorTabs, dir, lang: Lang) {
	let {defaultExtension} = lang;
	let extension = defaultExtension ? "." + defaultExtension : "";
	
	let name = nextName(function(n) {
		return lang.name + "-" + n + extension;
	}, function(name) {
		return !editorTabs.some(tab => tab.url.name === name);
	});
	
	let path = platform.fs(dir).child(name).path;
	let url = URL._new(path);
	
	return url;
}
