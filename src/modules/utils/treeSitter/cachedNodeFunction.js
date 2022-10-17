let LruCache = require("utils/LruCache");

/*
node getters (node.parent etc) are slow, so keep the results in a cache
*/

class NodeResultCache {
	constructor(size=300) {
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

module.exports = function(fn) {
	let cache = new NodeResultCache();
	
	return function(node) {
		if (cache.has(node)) {
			return cache.get(node);
		}
		
		let result = fn(node);
		
		cache.set(node, result);
		
		return result;
	}
}
