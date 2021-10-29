let LruCache = require("utils/LruCache");

class NodeResultCache {
	constructor(size=1000) {
		this.size = size;
		this.cacheByTree = new WeakMap();
	}
	
	has(node) {
		return this.cacheByTree.get(node.tree)?.has(node.id);
	}
	
	get(node) {
		return this.cacheByTree.get(node.tree).get(node.id);
	}
	
	set(node, value) {
		if (!this.cacheByTree.has(node.tree)) {
			this.cacheByTree.set(node.tree, new LruCache(this.size));
		}
		
		this.cacheByTree.get(node.tree).set(node.id, value);
	}
}

module.exports = NodeResultCache;
