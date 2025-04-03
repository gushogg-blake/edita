import nextName from "utils/nextName";
import {type Lang, URL} from "core";
import type EditorTab from "ui/App/tabs/EditorTab";

export default function(editorTabs: EditorTab[], dir: string, lang: Lang): URL {
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
