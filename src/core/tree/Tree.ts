import {
	Parser,
	Tree as TreeSitterTree,
	Node as TreeSitterNode,
	Query,
	//QueryMatch as TreeSitterQueryMatch,
} from "web-tree-sitter";

import mapArrayToObject from "utils/mapArrayToObject";
import {Cursor, c} from "core";
import type {Lang, Range} from "core";
import type {AppliedEdit} from "core/document";
import Node from "./Node";
import find from "./find";

import {
	cursorToTreeSitterPoint,
	rangeToTreeSitterRange,
} from "./treeSitterUtils";

type QueryCapture = {
	name: string;
	node: Node;
};

export type CaptureSingleResult = Record<string, Node>;

export default class Tree {
	lang: Lang;
	_tree: TreeSitterTree;
	wrap: (treeSitterNode: TreeSitterNode) => Node;
	
	constructor(lang, treeSitterTree) {
		this.lang = lang;
		
		this._tree = treeSitterTree;
		
		this.wrap = Node.getCachedWrapFunction(this);
	}
	
	get root() {
		return this.wrap(this._tree.rootNode);
	}
	
	wrap(treeSitterNode: TreeSitterNode): Node {
		return wrap(this.lang, treeSitterNode);
	}
	
	edit(appliedEdit: AppliedEdit): void {
		let {edit, index} = appliedEdit;
		let {selection, newSelection, string, replaceWith} = edit;
		
		this._tree.edit({
			startPosition: cursorToTreeSitterPoint(selection.start),
			startIndex: index,
			oldEndPosition: cursorToTreeSitterPoint(selection.end),
			oldEndIndex: index + string.length,
			newEndPosition: cursorToTreeSitterPoint(newSelection.end),
			newEndIndex: index + replaceWith.length,
		});
	}
	
	*generateNodesStartingOnLine(
		lineIndex: number,
		startOffset: number = 0,
	): Generator<Node> {
		let node = this.firstOnOrAfter(c(lineIndex, startOffset));
		
		while (node?.start.lineIndex === lineIndex && `spincheck=${10000}`) {
			yield node;
			
			node = node.next();
		}
	}
	
	firstOnOrAfter(cursor: Cursor): Node | null {
		return find.firstOnOrAfterCursor(this.root, cursor);
	}
	
	smallestAtChar(cursor: Cursor): Node | null {
		return find.smallestAtCharCursor(this.root, cursor);
	}
	
	query(query: Query, startCursor: Cursor = null): QueryCapture[][] {
		let options = {
			startPosition: startCursor ? cursorToTreeSitterPoint(startCursor) : undefined,
		};
		
		/*
		query.matches returns an array of objects, each with a list of captures
		which are {node, name} objects. we convert this to a list of lists of
		captures.
		
		the captures can be zero-length as * quantifiers in tree-sitter queries
		can generate a bunch of empty matches, so we filter those out
		*/
		
		return query.matches(this._tree.rootNode, options).map((match) => {
			return match.captures.map(({node: treeSitterNode, name}) => {
				return {
					node: this.wrap(treeSitterNode),
					name,
				};
			});
		}).filter(captures => captures.length > 0);
	}
	
	/*
	query and return a single captured node per capture name
	*/
	
	captureSingle(query: Query): Record<string, Node>[] {
		return this.query(query).map((result) => {
			return mapArrayToObject(result, capture => [capture.name, capture.node]);
		});
	}
	
	static createTreeSitterParser(lang: Lang): Parser {
		let parser = new Parser();
		let {treeSitterLanguage} = lang;
		
		if (!treeSitterLanguage) {
			// langs must be pre-initialised with base.initLang.
			
			throw new Error("tree-sitter language not initialised");
		}
		
		parser.setLanguage(treeSitterLanguage);
		
		return parser;
	}
	
	static parse(lang: Lang, code: string, editedTree?: Tree, includedRanges?: Range[]): Tree {
		let parser = Tree.createTreeSitterParser(lang);
		
		let treeSitterTree = parser.parse(code, editedTree?._tree, {
			includedRanges: includedRanges?.map(rangeToTreeSitterRange),
		});
		
		return new Tree(lang, treeSitterTree);
	}
}
