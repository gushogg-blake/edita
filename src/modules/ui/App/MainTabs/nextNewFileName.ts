import nextName from "utils/nextName";
import {type Lang, URL} from "modules/core";

export default function(lang: Lang) {
	let {defaultExtension} = lang;
	let extension = defaultExtension ? "." + defaultExtension : "";
	
	let name = nextName(function(n) {
		return lang.name + "-" + n + extension;
	}, function(name) {
		return !files.some(file => file.url.toString().endsWith("/" + name));
	});
	
	let path = platform.fs(dir).child(name).path;
	let url = URL._new(path);
	
	return url;
}
