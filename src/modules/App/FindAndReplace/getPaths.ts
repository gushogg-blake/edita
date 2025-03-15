module.exports = async function(options) {
	let {
		paths,
		includePatterns,
		excludePatterns,
		searchInSubDirs,
	} = options;
	
	let walkOptions = {
		includePatterns,
		excludePatterns,
		searchInSubDirs,
	};
	
	let allPaths = [];
	
	for (let path of paths) {
		let node = platform.fs(path);
		
		if (await node.isDir()) {
			allPaths = [...allPaths, ...await node.walkAll(walkOptions)];
		} else {
			allPaths = [...allPaths, path];
		}
	}
	
	return allPaths;
}
