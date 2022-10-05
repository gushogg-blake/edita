class NodeWithRange {
	constructor(range, node) {
		this.range = range;
		this.node = node;
	}
	
	get scope() {
		return this.range.scope;
	}
	
	next() {
		return this.scope.nextNodeWithRange(this);
	}
	
	parent() {
		return this.scope.parentNodeWithRange(this);
	}
}

module.exports = NodeWithRange;
