class NodeWithRange {
	constructor(range, node) {
		this.range = range;
		this.node = node;
	}
	
	get scope() {
		return this.range.scope;
	}
	
	next() {
		return this.scope.source.nextNodeWithRange(this);
	}
	
	parent() {
		return this.scope.source.parentNodeWithRange(this);
	}
}

module.exports = NodeWithRange;
