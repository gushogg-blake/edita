import nextName from "utils/nextName";
import {type Lang, FileLikeURL} from "core";
import type EditorTab from "ui/app/tabs/EditorTab";

export default function(editorTabs: EditorTab[], dir: string, lang: Lang): FileLikeURL {
	let {defaultExtension} = lang;
	let extension = defaultExtension ? "." + defaultExtension : "";
	
	let name = nextName(function(n) {
		return lang.name + "-" + n + extension;
	}, function(name) {
		return !editorTabs.some(tab => platform.fs(tab.url.path).name === name);
	});
	
	let path = platform.fs(dir).child(name).path;
	let url = FileLikeURL._new(path);
	
	return url;
}
