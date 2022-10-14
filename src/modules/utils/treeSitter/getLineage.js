let nodeGetters = require("./nodeGetters");

module.exports = function(node) {
	let lineage = [node];
	let parent = nodeGetters.parent(node);
	
	while (parent) {
		lineage.unshift(parent);
		
		parent = nodeGetters.parent(parent);
	}
	
	return lineage;
}
