class NodeWithScope {
	constructor(scope, range, node) {
		this.scope = scope;
		this.range = range;
		this.node = node;
	}
	
	next() {
		return this.scope.nextNodeWithScope(this);
	}
	
	parent() {
		return this.scope.parentNodeWithScope(this);
	}
}

module.exports = NodeWithScope;
