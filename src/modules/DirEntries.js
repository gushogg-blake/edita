let bluebird = require("bluebird");

module.exports = {
	async createEntry(path) {
		let node = platform.fs(path);
		
		return {
			path,
			node,
			isDir: await node.isDir(),
		};
	},
	
	async ls(dir) {
		let entries = await bluebird.map(
			platform.fs(dir).lsWithTypes(),
			({isDir, node}) => {
				return {
					isDir,
					node,
					path: node.path,
				};
			},
		);
		
		let dirs = entries.filter(e => e.isDir);
		let files = entries.filter(e => !e.isDir);
		
		return [...dirs, ...files];
	},
};
