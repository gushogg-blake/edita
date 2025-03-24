import multimatch from "utils/multimatch";
import {alwaysIncludeDirInTabTitle} from "base/conventions";

export default function(tab, tabs) {
	let sep = platform.systemInfo.pathSeparator;
	let node = platform.fs(tab.path);
	let {name, basename, extension} = node;
	let shortenedName = name;
	let prefixWithParentByConvention = "";
	
	// shorten
	
	if (basename.length > 20) {
		shortenedName = basename.substr(0, 8).trim() + "..." + basename.substr(-8).trim() + extension;
	}
	
	// conventions - always include dir for generic names like index.js
	
	if (multimatch(alwaysIncludeDirInTabTitle, node.name)) {
		prefixWithParentByConvention = node.parent.name + sep;
	}
	
	/*
	disambiguation
	
	start with the filename and for all tabs with same filename,
	step back until we find an ancestor dir that's different
	
	then, if we just stepped back one dir just prepend it
	
	otherwise, prepend the dir, /.../, then the filename (the dots
	representing path parts that are the same between tabs)
	*/
	
	if (node.parent.isRoot) {
		return shortenedName;
	}
	
	let others = tabs.map(other => platform.fs(other.path)).filter(function(other) {
		return (
			other.path !== node.path
			&& other.name === node.name
		);
	});
	
	if (others.length === 0) {
		return {
			label: prefixWithParentByConvention + shortenedName,
		};
	}
	
	let startNode = node;
	
	do {
		startNode = startNode.parent;
		others = others.map(other => other.parent);
	} while (others.some(other => other.name === startNode.name));
	
	if (startNode.isRoot) {
		/*
		other tabs' paths are our full path with a prefix -
		handle this case specially to avoid disambiguating it
		as //.../filename
		*/
		
		return {
			label: prefixWithParentByConvention + shortenedName,
		};
	}
	
	let disambiguator = "";
	
	if (startNode.path === node.parent.path) {
		disambiguator = prefixWithParentByConvention ? "" : startNode.name + sep;
	} else {
		disambiguator = startNode.name + sep + "..." + sep;
	}
	
	return {
		label: prefixWithParentByConvention + shortenedName,
		disambiguator,
	};
}
