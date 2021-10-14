let asyncGenerateArray = require("utils/asyncGenerateArray");

module.exports = function(backends) {
	let {
		fs,
		path: osPath,
		minimatch,
	} = backends;
	
	function include(options, name, isDir) {
		let {
			includePatterns,
			excludePatterns,
		} = options;
		
		for (let pattern of excludePatterns) {
			if (minimatch(name, pattern)) {
				return false;
			}
		}
		
		if (isDir) {
			return true;
		}
		
		if (includePatterns.length > 0) {
			for (let pattern of includePatterns) {
				if (minimatch(name, pattern)) {
					return true;
				}
			}
			
			return false;
		}
		
		return true;
	}
	
	async function *walk(dir, options, root=dir) {
		for await (let entry of await fs.promises.opendir(dir)) {
			let {name} = entry;
			let path = osPath.join(dir, name);
			let isDir = entry.isDirectory();
			let isFile = entry.isFile();
			
			if (!isFile && !isDir || !include(options, name, isDir)) {
				continue;
			}
			
			if (isFile) {
				yield path;
			}
			
			if (isDir && options.searchInSubDirs) {
				yield* walk(path, options, root);
			}
		}
	}
	
	function all(dir, options) {
		return asyncGenerateArray(walk(dir, options));
	}
	
	return {
		walk,
		all,
	};
}
