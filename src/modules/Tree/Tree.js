let Cursor = require("modules/Cursor");
let Node = require("./Node");

let {
	cursorToTreeSitterPoint,
	rangeToTreeSitterRange,
	find,
} = require("./treeSitterUtils");

let {c} = Cursor;

class Tree {
	constructor(lang, treeSitterTree) {
		this.lang = lang;
		
		this._tree = treeSitterTree;
		
		this.wrap = Node.getCachedWrapFunction(this.lang);
	}
	
	get rootNode() {
		return this.wrap(this._tree.rootNode);
	}
	
	wrap(treeSitterNode) {
		return wrap(this.lang, treeSitterNode);
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
		let node = this.firstOnOrAfter(c(lineIndex, startOffset));
		
		while (node?.start.lineIndex === lineIndex) {
			yield node;
			
			node = node.next();
		}
	}
	
	firstOnOrAfter(cursor) {
		return this.wrap(find.firstOnOrAfterCursor(this.rootNode._node, cursor));
	}
	
	smallestAtChar(cursor) {
		return this.wrap(find.smallestAtCharCursor(this.rootNode._node, cursor));
	}
	
	query(query, startCursor=null) {
		let startPosition = startCursor ? cursorToTreeSitterPoint(startCursor) : null;
		
		/*
		query.matches returns an array of objects, each with a list of captures
		which are {node, name} objects. we convert this to a list of lists of
		captures.
		
		the captures can be zero-length as * quantifiers in tree-sitter queries
		can generate a bunch of empty matches, so we filter those out
		*/
		
		return query.matches(this._tree.rootNode, startPosition).map((match) => {
			return match.captures.map(({node: treeSitterNode, name}) => {
				return {
					node: this.wrap(treeSitterNode),
					name,
				};
			});
		}).filter(captures => captures.length > 0);
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
		
		return new Tree(lang, treeSitterTree);
	}
}

module.exports = Tree;