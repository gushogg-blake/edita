let NodeResultCache = require("./NodeResultCache");

/*
node getters (node.parent etc) are slow, so keep the results in a cache
*/

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
