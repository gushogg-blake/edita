let Node = require("modules/Node");

function rangeToTreeSitterRange(range) {
	let {
		startIndex,
		endIndex,
		selection,
	} = range;
	
	return {
		startIndex,
		endIndex,
		
		startPosition: {
			row: selection.start.lineIndex,
			column: selection.start.offset,
		},
		
		endPosition: {
			row: selection.end.lineIndex,
			column: selection.end.offset,
		},
	};
}

class Tree {
	constructor(treeSitterTree) {
		this._tree = treeSitterTree;
	}
	
	get rootNode() {
		return new Node(this._tree.rootNode);
	}
	
	edit(...args) {
		this._tree.edit(...args);
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
