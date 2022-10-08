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
	
	stack() {
		let node = this;
		let stack = [];
		
		while (node) {
			stack.unshift(node);
			
			node = node.parent();
		}
		
		return stack;
	}
}

module.exports = NodeWithRange;
