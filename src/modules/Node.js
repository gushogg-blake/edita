let findFirstChildAfterCursor = require("modules/utils/treeSitter/findFirstChildAfterCursor");
let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");

let {s} = Selection;
let {c} = Cursor;

function treeSitterPointToCursor(point) {
	return c(point.row, point.column);
}

class Node {
	constructor(treeSitterNode) {
		this._node = treeSitterNode;
		
		
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
	
	equals(node) {
		return this._node.equals(node._node);
	}
	
	findFirstChildAfterCursor(cursor) {
		return findFirstChildAfterCursor(this, cursor);
	}
	
	get(field) {
		return nodeUtils[field](this._node);
	}
}

module.exports = Node;
