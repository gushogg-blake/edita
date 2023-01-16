let {nodeUtils, find, cachedNodeFunction} = require("./treeSitterUtils");

class Node {
	constructor(tree, treeSitterNode) {
		this.tree = tree;
		
		this._node = treeSitterNode;
		
		this.wrap = Node.getCachedWrapFunction(this.tree);
	}
	
	get lang() {
		return this.tree.lang;
	}
	
	get id() {
		return this._node.id;
	}
	
	get type() {
		return this.get("type");
	}
	
	get text() {
		return this.get("text");
	}
	
	get selection() {
		return this.get("selection");
	}
	
	get parent() {
		return this.wrap(this.get("parent"));
	}
	
	get nextSibling() {
		return this.wrap(this.get("nextSibling"));
	}
	
	get firstChild() {
		return this.wrap(this.get("firstChild"));
	}
	
	get lastChild() {
		return this.wrap(this.get("lastChild"));
	}
	
	get children() {
		return this._node.children.map(this.wrap);
	}
	
	get namedChildren() {
		return this._node.namedChildren.map(this.wrap);
	}
	
	get isRoot() {
		return this.equals(this.tree.root);
	}
	
	get start() {
		return this.selection.start;
	}
	
	get end() {
		return this.selection.end;
	}
	
	next() {
		return this.wrap(nodeUtils.next(this._node));
	}
	
	firstChildAfter(cursor) {
		return this.wrap(find.firstChildAfterCursor(this._node, cursor));
	}
	
	isOnOrAfter(cursor) {
		return this.start.isOnOrAfter(cursor);
	}
	
	isMultiline() {
		return this.selection.isMultiline();
	}
	
	equals(node) {
		return this._node.equals(node._node);
	}
	
	lineage() {
		return nodeUtils.lineage(this._node).map(this.wrap);
	}
	
	get(field) {
		return nodeUtils[field](this._node);
	}
	
	static getCachedWrapFunction(tree) {
		let getter = cachedNodeFunction(treeSitterNode => new Node(tree, treeSitterNode));
		
		return treeSitterNode => treeSitterNode && getter(treeSitterNode);
	}
}

module.exports = Node;
