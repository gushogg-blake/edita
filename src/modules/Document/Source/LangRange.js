let advanceCursor = require("./utils/treeSitter/advanceCursor");
let next = require("./utils/treeSitter/next");
let rangeToTreeSitterRange = require("./utils/treeSitter/rangeToTreeSitterRange");
let treeSitterRangeToRange = require("./utils/treeSitter/treeSitterRangeToRange");
let cursorToTreeSitterPoint = require("./utils/treeSitter/cursorToTreeSitterPoint");
let findFirstNodeToRender = require("./utils/treeSitter/findFirstNodeToRender");

module.exports = class LangRange {
	constructor(parent, parentNode, lang, code, range) {
		this.parent = parent;
		this.parentNode = parentNode;
		this.lang = lang;
		this.code = code;
		this.range = range;
		this.treeSitterRange = rangeToTreeSitterRange(range);
		
		this.langRanges = [];
		this.langRangesByCursor = {};
		this.langRangesByNode = {};
		
		this.parse();
	}
	
	parse() {
		console.time("parse (" + this.lang.code + ")");
		
		let parser = new TreeSitter();
		
		parser.setLanguage(base.getTreeSitterLanguage(this.lang.code));
		
		this.tree = parser.parse(this.code, null, {
			includedRanges: [this.treeSitterRange],
		});   
		
		for (let injection of this.lang.injections) {
			let nodes = injection.query.matches(this.tree.rootNode).map(function(match) {
				let [capture] = match.captures;
				
				for (let capture of match.captures) {
					if (capture.name === "injectionNode") {
						return capture.node;
					}
				}
				
				return null;
			}).filter(Boolean);
			
			for (let node of nodes) {
				if (node.text.length > 0) {
					let injectionLang = base.langs.get(injection.lang(node));
					
					if (injectionLang) {
						let langRange = new LangRange(this, node, injectionLang, this.code, treeSitterRangeToRange(node));
						
						this.langRanges.push(langRange);
						this.langRangesByCursor[node.startPosition.row + "," + node.startPosition.column] = langRange;
						this.langRangesByNode[node.id] = langRange;
					}
				}
			}
		}
		
		console.timeEnd("parse (" + this.lang.code + ")");
	}
	
	edit(edit, index, newRange, newParentNode, code) {
		let {
			selection,
			newSelection,
			string,
			replaceWith,
		} = edit;
		
		this.newParentNode = newParentNode;
		this.code = code;
		
		//
		this.langRanges = [];
		this.langRangesByCursor = {};
		this.langRangesByNode = {};
		
		this.range = newRange;
		this.treeSitterRange = rangeToTreeSitterRange(this.range);
		
		this.parse();
		//
		
		
		//let oldRangesByCursor = this.langRangesByCursor;
		//
		//this.langRanges = [];
		//this.langRangesByCursor = {};
		//this.langRangesByNode = {};
		
		
		
		
		/*
		surgically editing child ranges can be done in two general steps:
		
			- for each child range, if the edit starts and ends before the
			  range, starts within the range, or starts after the range,
			  save the range, indexed by its start cursor
			
			- when going through the new tree, check whether nodes match
			  saved child ranges by checking the lang and the start cursor
			  (with the old start cursor adjusted for the edit)
		
		this way there are a few scenarios where we can save and edit child
		ranges instead of recreating them:
		
			- if html is edited entirely above a <script> tag, its start
			  cursor can be adjusted, and when we process the new tree,
			  we'll come to a javascript injection node that has a matching
			  start cursor
			
			- if html is edited below a <script> tag, the same as above,
			  except the start cursor won't even need adjusting
			
			- if javascript is edited within a <script> tag, the injection
			  node's range may be different - e.g. if a </script> tag is
			  added - but this shouldn't matter as we'll pass the new
			  range in includedRanges
		
		we may even be able to save ranges in the case of overlapping edits:
		
			- if the edit overlaps the top, there may not be a matching
			  injection node any more, in which case we just won't use
			  the saved range
			
			- if the edit overlaps the bottom, there probably will be a
			  matching range in the new code, and we'll just update the
			  range
			
			- if the edit entirely encloses the range, it may be e.g. a
			  paste that happens to contain a new <script> tag - but if
			  not then as with a top-overlap, we can just not use the range
			  (in this case the start cursor would need to be the same as
			  in the old code in order to identify it)
		*/
		
		//let parser = new TreeSitter();
		//
		//parser.setLanguage(base.getTreeSitterLanguage(this.lang.code));
		//
		//this.tree.edit({
		//	startPosition: cursorToTreeSitterPoint(selection.start),
		//	startIndex: index,
		//	oldEndPosition: cursorToTreeSitterPoint(selection.end),
		//	oldEndIndex: index + string.length,
		//	newEndPosition: cursorToTreeSitterPoint(newSelection.end),
		//	newEndIndex: index + replaceWith.length,
		//});
		//
		//this.tree = parser.parse(this.code, this.tree, {
		//	includedRanges: [this.treeSitterRange],
		//});
		
		
	}
	
	getRenderHints(node) {
		if (node.type === "ERROR") {
			return [{
				lang: this.lang,
				node,
			}];
		}
		
		return this.lang.generateRenderHints(node);
	}
	
	findFirstNodeToRender(lineIndex) {
		let node = findFirstNodeToRender(this.tree, lineIndex);
		let childRange = this.langRangesByNode[node.id];
		
		if (childRange) {
			return childRange.findFirstNodeToRender(lineIndex);
		}
		
		return {
			langRange: this,
			node,
		};
	}
	
	next(node, out=false) {
		let childRange = this.langRangesByNode[node.id];
		
		if (childRange && !out) {
			return {
				langRange: childRange,
				node: childRange.tree.rootNode,
			};
		}
		
		node = next(node);
		
		if (!node) {
			if (this.parent) {
				return this.parent.next(this.parentNode, true);
			} else {
				return {
					langRange: this,
					node: null,
				};
			}
		}
		
		return {
			langRange: this,
			node,
		};
	}
	
	*generateNodes_pointers() {
		let node = this.tree.rootNode;
		
		while (true) {
			yield node;
			
			if (this.langRangesByNode[node.id]) {
				for (let childNode of this.langRangesByNode[node.id].generateNodes_pointers()) {
					yield childNode;
				}
			}
			
			node = next(node);
			
			if (!node) {
				break;
			}
		}
	}
	
	*generateNodes_cursor() {
		let cursor = this.tree.walk();
		
		while (true) {
			let node = cursor.currentNode();
			
			yield node;
			
			if (this.langRangesByNode[node.id]) {
				for (let childNode of this.langRangesByNode[node.id].generateNodes_cursor()) {
					yield childNode;
				}
			}
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
	}
}
