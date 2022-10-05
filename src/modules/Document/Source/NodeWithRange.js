class NodeWithRange {
	constructor(range, node) {
		this.range = range;
		this.node = node;
	}
	
	next() {
		return this.range.nextNodeWithRange(this);
	}
	
	parent() {
		return this.range.parentNodeWithRange(this);
	}
}

module.exports = NodeWithRange;
