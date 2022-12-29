let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");
let {nodeGetters} = require("./treeSitterUtils");

let {s} = Selection;
let {c} = Cursor;

function wrap(lang, treeSitterNode) {
	return treeSitterNode && new Node(lang, treeSitterNode);
}

class Node {
	constructor(lang, treeSitterNode) {
		this.lang = lang;
		
		this._node = treeSitterNode;
	}
	
	get type() {
		return this.get("type");
	}
	
	get selection() {
		return this.get("selection");
	}
	
	get parent() {
		return this.get("parent");
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
	
	get(field) {
		return nodeGetters[field](this._node);
	}
	
	static wrap = wrap;
}

module.exports = Node;
