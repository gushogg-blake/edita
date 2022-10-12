let nodeGetters = require("modules/utils/treeSitter/nodeGetters");
let compareNodeAndCharCursor = require("modules/utils/treeSitter/compareNodeAndCharCursor");
let findFirstChildAfterCharCursor = require("modules/utils/treeSitter/findFirstChildAfterCharCursor");

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
	
	/*
	given a char cursor for which this is the smallest node, return the next
	node after the char cursor
	*/
	
	nextAfterCharCursor(cursor) {
		let next = this.next();
		
		if (!next) {
			return null;
		}
		
		if (compareNodeAndCharCursor(next.node, cursor) === "cursorBeforeNode") {
			return next;
		}
		
		// since there's a node and it's not after the cursor, it must be a child
		// of this node, so look for a child that's after the cursor
		
		let firstChildAfterCharCursor = findFirstChildAfterCharCursor(this.node, cursor, 1);
		
		if (firstChildAfterCharCursor) {
			let range = this.scope.findRangeContainingStart(firstChildAfterCharCursor);
			
			return new NodeWithRange(range, firstChildAfterCharCursor);
		}
		
		// if none of the children are after the cursor, go next from the last child
		// (to effectively go next from this node without stepping into the children)
		
		let children = nodeGetters.children(this.node);
		let lastChildNode = children[children.length - 1];
		let range = this.scope.findRangeContainingStart(lastChildNode);
		let lastChild = new NodeWithRange(range, lastChildNode);
		
		return lastChild.next();
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
