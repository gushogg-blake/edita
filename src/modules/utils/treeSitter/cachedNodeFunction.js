let NodeResultCache = require("./NodeResultCache");

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
