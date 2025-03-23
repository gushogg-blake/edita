export default async function(options) {
	let {
		paths,
		includePatterns,
		excludePatterns,
		searchInSubDirs,
	} = options;
	
	let allPaths = [];
	
	for (let path of paths) {
		let node = platform.fs(path);
		
		if (await node.isDir()) {
			allPaths = [...allPaths, ...await node.glob(includePatterns, {
				ignore: excludePatterns,
				maxDepth: searchInSubDirs ? undefined : 1,
			})];
		} else {
			allPaths = [...allPaths, path];
		}
	}
	
	return allPaths;
}
