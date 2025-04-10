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
		
		if ([startNode, ...others].every(node => node.isRoot)) {
			/*
			this can happen if there are > 2 paths and they're different in
			different places, meaning that we skip over the differences as
			we go up the hierarchy on all paths.
			e.g. with:
			- /edita/src/modules/ipc/jsonStore.js
			- /edita/src/mainProcess/ipc/jsonStore.js
			- /edita/src/mainProcess/modules/jsonStore.js
			there are at least 2 identical names at each step:
			(jsonStore x 3; ipc x 2; mainProcess x 2; then all identical)
			in this case we go the other way and just remove the largest common
			prefix
			
			TODO not actually sure what to do here... more complex algo
			than I thought.
			
			maybe something like remove the largest common ancestor,
			then advance as far as we need to to be unique? or - find first
			(from left) unique ancestor, then try both ways -- including
			more dirs from the left or more from the right -- and see which
			one gives the shortest disambiguation (fewest dirs).
			
			this strat might conflict though depending on the other disambiguations...
			
			OK so the actual solution is this:
			
			- step back as far as necessary to be absolutely unique, not counting
			  any other nodes' parents or anything, just the smallest unique right
			  hand side of the path
			
			- then start at the left and go just as far right as needed to be
			  unique. everything to the right of that, minus the name and the
			  immediate parent if needed, can be replaced with /.../.
			
			just breaking for now as already sidetracked...
			*/
			
			//let commonAncestor = startNode.getCommonAncestor(...others);
			break;
		}
	} while (others.some(other => other.name === startNode.name) && `spincheck=${1000}`);
	
	if (startNode.isRoot) {
		/*
		other tabs' paths are our full path with a prefix -
		handle this case specially to avoid disambiguating it
		as //.../filename
		
		NOTE this isn't necessarily right, see above for cases with > 2
		paths that skip over the differences
		
		in some cases it will still result in a disambiguation, just not
		necessarily a very helpful one -- and anything is better than an
		infinite loop of course
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
