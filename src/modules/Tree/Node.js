let {nodeUtils, find} = require("./treeSitterUtils");

function wrap(lang, treeSitterNode) {
	return treeSitterNode && new Node(lang, treeSitterNode);
}

class Node {
	constructor(lang, treeSitterNode) {
		this.lang = lang;
		
		this._node = treeSitterNode;
		
		this._wrap = this.wrap.bind(this);
	}
	
	get id() {
		return this._node.id;
	}
	
	get type() {
		return this.get("type");
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
	
	isMultiline() {
		return this.selection.isMultiline();
	}
	
	equals(node) {
		return this._node.equals(node._node);
	}
	
	lineage() {
		return nodeUtils.lineage(this._node).map(this._wrap);
	}
	
	get(field) {
		return nodeUtils[field](this._node);
	}
	
	wrap(treeSitterNode) {
		return wrap(this.lang, treeSitterNode);
	}
	
	static wrap = wrap;
}

module.exports = Node;
