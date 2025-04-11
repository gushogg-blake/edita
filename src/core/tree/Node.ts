import type {Node as TreeSitterNode} from "web-tree-sitter";
import {nodeGetters, cachedNodeFunction} from "./treeSitterUtils";
import find from "./find";
import type Tree from "./Tree";

export default class Node {
	tree: Tree;
	_node: TreeSitterNode;
	wrap: (treeSitterNode: TreeSitterNode) => Node;
	
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
	
	get previousSibling() {
		return this.wrap(this.get("previousSibling"));
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
		return this.wrap(nodeGetters.next(this._node));
	}
	
	firstChildAfter(cursor) {
		return find.firstChildAfterCursor(this, cursor);
	}
	
	isOnOrAfter(cursor) {
		return this.start.isOnOrAfter(cursor);
	}
	
	containsCharCursor(cursor) {
		return this.selection.containsCharCursor(cursor);
	}
	
	isMultiline() {
		return this.selection.isMultiline();
	}
	
	equals(node) {
		return this._node.equals(node._node);
	}
	
	lineage() {
		return nodeGetters.lineage(this._node).map(this.wrap);
	}
	
	*generateSelectionsExcludingChildren() {
		let start = this.selection.start;
		let nextChild = this.firstChild;
		
		while (`spincheck=${10000}`) {
			let end = nextChild?.selection.start || this.selection.end;
			let selection = s(start, end);
			
			if (selection.isFull) {
				yield selection;
			}
			
			if (end.equals(this.selection.end)) {
				break;
			}
			
			start = nextChild.end;
			nextChild = nextChild.nextSibling;
		}
	}
	
	selectionsExcludingChildren() {
		return [...this.generateSelectionsExcludingChildren()];
	}
	
	get(field) {
		return nodeGetters[field](this._node);
	}
	
	static getCachedWrapFunction(tree: Tree) {
		let getter = cachedNodeFunction(treeSitterNode => new Node(tree, treeSitterNode));
		
		return treeSitterNode => treeSitterNode && getter(treeSitterNode);
	}
}
