import bluebird from "bluebird";

export type DirEntry = {
	path: string;
	node: any; // TYPE fs Node
	isDir: boolean;
};

function compareEntries(a, b) {
	return a.node.name.localeCompare(b.node.name);
}

export default {
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
		
		let dirs = entries.filter(e => e.isDir).sort(compareEntries);
		let files = entries.filter(e => !e.isDir).sort(compareEntries);
		
		return [...dirs, ...files];
	},
};
