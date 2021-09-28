let {promises: fs} = require("fs");
let osPath = require("path");
let minimatch = require("minimatch");

function include(options, result) {
	let {
		includePatterns,
		excludePatterns,
	} = options;
	
	for (let pattern of excludePatterns) {
		if (minimatch(result.name, pattern)) {
			console.log(result.name, pattern);
			console.log(minimatch(result.name, pattern));
			return false;
		}
	}
	
	if (includePatterns.length > 0) {
		for (let pattern of includePatterns) {
			if (minimatch(result.name, pattern)) {
				return true;
			}
		}
		
		return false;
	}
	
	return true;
}

async function *walk(dir, options, root=dir) {
	for await (let entry of await fs.opendir(dir)) {
		let {name} = entry;
		let path = osPath.join(dir, name);
		let isDir = entry.isDirectory();
		
		let result = {
			name,
			path,
			isDir,
		};
		
		if (!include(options, entry)) {
			continue;
		}
		
		if (!isDir || options.includeDirs) {
			yield result;
		}
		
		if (isDir && options.searchInSubDirs) {
			yield* walk(path, options, root);
		}
	}
}

async function all(dir, options) {
	let results = [];
	
	for await (let path of walk(dir, options)) {
		results.push(path);
	}
	
	return results;
}

module.exports = {
	walk,
	all,
};
