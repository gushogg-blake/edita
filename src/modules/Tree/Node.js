let findFirstChildAfterCursor = require("modules/utils/treeSitter/findFirstChildAfterCursor");
let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");

let {s} = Selection;
let {c} = Cursor;

function wrap(treeSitterNode) {
	return treeSitterNode && new Node(treeSitterNode);
}

class Node {
	constructor(treeSitterNode) {
		this._node = treeSitterNode;
		
		
	}
	
	get type() {
		return this.get("type");
	}
	
	get selection() {
		return this.get("selection");
	}
	
	get start() {
		return this.selection.start;
	}
	
	get end() {
		return this.selection.end;
	}
	
	isMultiline() {
		return this.selection.isMultiline();
	}
	
	equals(node) {
		return this._node.equals(node._node);
	}
	
	findFirstChildAfterCursor(cursor) {
		return wrap(findFirstChildAfterCursor(this, cursor));
	}
	
	get(field) {
		return nodeGetters[field](this._node);
	}
	
	static wrap = wrap;
}

module.exports = Node;
