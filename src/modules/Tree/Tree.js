let Cursor = require("modules/Cursor");
let Node = require("./Node");

let let {
	cursorToTreeSitterPoint,
	rangeToTreeSitterRange,
	findFirstNodeOnOrAfterCursor,
} = require("./treeSitterUtils");

let {c} = Cursor;

class Tree {
	constructor(treeSitterTree) {
		this._tree = treeSitterTree;
	}
	
	get rootNode() {
		return new Node(this._tree.rootNode);
	}
	
	edit(edit, index) {
		let {
			selection,
			newSelection,
			string,
			replaceWith,
		} = edit;
		
		this._tree.edit({
			startPosition: cursorToTreeSitterPoint(selection.start),
			startIndex: index,
			oldEndPosition: cursorToTreeSitterPoint(selection.end),
			oldEndIndex: index + string.length,
			newEndPosition: cursorToTreeSitterPoint(newSelection.end),
			newEndIndex: index + replaceWith.length,
		});
	}
	
	*generateNodesOnLine(lineIndex, startOffset=0) {
		let treeSitterNode = findFirstNodeOnOrAfterCursor(this._tree.rootNode, c(lineIndex, startOffset));
		
		if (!treeSitterNode) {
			return;
		}
		
		let node = new Node(treeSitterNode);
		
		while (node?.start.lineIndex === lineIndex) {
			yield node;
			
			node = node.next();
		}
	}
	
	findSmallestNodeAtCharCursor(cursor) {
	}
	
	findFirstNodeOnOrAfterCursor(cursor) {
	}
	
	query(query, startCursor=null) {
		let startPosition = startCursor ? cursorToTreeSitterPoint(startCursor) : null;
		
		return query.matches(this._tree.rootNode, startPosition); // TODO wrap
	}
	
	static createTreeSitterParser(lang) {
		let parser = new TreeSitter();
		let {treeSitterLanguage} = lang;
		
		if (!treeSitterLanguage) {
			// langs must be pre-initialised with base.initLang.
			
			throw new Error("tree-sitter language not initialised");
		}
		
		parser.setLanguage(treeSitterLanguage);
		
		return parser;
	}
	
	static parse(lang, code, editedTree, includedRanges) {
		let parser = Tree.createTreeSitterParser(lang);
		
		let treeSitterTree = parser.parse(code, editedTree?._tree, {
			includedRanges: includedRanges?.map(rangeToTreeSitterRange),
		});
		
		return new Tree(treeSitterTree);
	}
}

module.exports = Tree;
