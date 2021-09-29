let {promises: fs} = require("fs");
let osPath = require("path");
let minimatch = require("minimatch");
let asyncGenerateArray = require("utils/asyncGenerateArray");

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
	for await (let entry of await fs.opendir(dir)) {
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

module.exports = {
	walk,
	all,
};
