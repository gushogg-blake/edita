let advanceCursor = require("./utils/treeSitter/advanceCursor");
let next = require("./utils/treeSitter/next");
let cursorToTreeSitterPoint = require("./utils/treeSitter/cursorToTreeSitterPoint");
let findFirstNodeToRender = require("./utils/treeSitter/findFirstNodeToRender");
let generateNodesOnLine = require("./utils/treeSitter/generateNodesOnLine");
let Range = require("./Range");

module.exports = class Scope {
	constructor(parent, lang, code, ranges) {
		this.parent = parent;
		this.lang = lang;
		this.code = code;
		this.ranges = ranges;
		this.treeSitterRanges = ranges.map(Range.toTreeSitterRange);
		
		this.scopes = [];
		this.scopesByCursor = {};
		this.scopesByNode = {};
		this.rangesByCursor = {};
		
		for (let range of ranges) {
			this.rangesByCursor[range.cursorKey] = range;
		}
		
		this.parse();
	}
	
	parse() {
		console.time("parse (" + this.lang.code + ")");
		
		let parser = new TreeSitter();
		
		parser.setLanguage(base.getTreeSitterLanguage(this.lang.code));
		
		this.tree = parser.parse(this.code, null, {
			includedRanges: this.treeSitterRanges,
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
			
			if (injection.combined) {
				let injectionLang = base.langs.get(injection.lang);
				
				if (injectionLang) {
					let ranges = nodes.map(Range.fromNode);
					let scope = new Scope(this, node, injectionLang, this.code, ranges);
					
					this.scopes.push(scope);
					
					for (let range of ranges) {
						this.scopesByCursor[range.cursorKey] = scope;
					}
					
					for (let node of nodes) {
						this.scopesByNode[node.id] = scope;
					}
				}
			} else {
				for (let node of nodes) {
					if (node.text.length > 0) {
						let injectionLang = base.langs.get(injection.lang(node));
						
						if (injectionLang) {
							let range = Range.fromNode(node);
							let scope = new Scope(this, node, injectionLang, this.code, [range]);
							
							this.scopes.push(scope);
							this.scopesByCursor[range.cursorKey] = scope;
							this.scopesByNode[node.id] = scope;
						}
					}
				}
			}
			
		}
		
		console.timeEnd("parse (" + this.lang.code + ")");
	}
	
	edit(edit, index, newRanges, code) {
		let {
			selection,
			newSelection,
			string,
			replaceWith,
		} = edit;
		
		this.code = code;
		
		//
		this.scopes = [];
		this.scopesByCursor = {};
		this.scopesByNode = {};
		
		this.ranges = newRanges;
		this.treeSitterRanges = this.ranges.map(Range.toTreeSitterRange);
		
		this.parse();
		//
		
		
		//let oldRangesByCursor = this.scopesByCursor;
		//
		//this.scopes = [];
		//this.scopesByCursor = {};
		//this.scopesByNode = {};
		
		
		
		
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
		//	includedRanges: this.treeSitterRanges,
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
		let childScope = this.scopesByNode[node.id];
		
		if (childScope) {
			return childScope.findFirstNodeToRender(lineIndex);
		}
		
		return {
			scope: this,
			range: this.findContainingRange(node),
			node,
		};
	}
	
	findContainingRange(node) {
		for (let range of this.ranges) {
			if (Selection.isWithin(Selection.fromNode(node), range.selection) {
				return range;
			}
		}
	}
	
	next(node, out=false) {
		let childScope = this.scopesByNode[node.id];
		
		if (childRange && !out) {
			return {
				scope: childRange,
				node: childRange.tree.rootNode,
			};
		}
		
		node = next(node);
		
		if (this.rangesByNode[node.id]) {
			
		}
		
		if (!node) {
			if (this.parent) {
				return this.parent.next(this.parentNode, true);
			} else {
				return {
					scope: this,
					node: null,
				};
			}
		}
		
		return {
			scope: this,
			node,
		};
	}
	
	*generateNodesOnLine(lineIndex) {
		for (let node of generateNodesOnLine(this.tree, lineIndex)) {
			yield node;
			
			let childRange = this.scopesByNode[node.id];
			
			if (childRange) {
				for (let childNode of childRange.generateNodesOnLine(lineIndex)) {
					yield childNode;
				}
			}
		}
	}
	
	*generateNodes_pointers() {
		let node = this.tree.rootNode;
		
		while (true) {
			yield node;
			
			if (this.scopesByNode[node.id]) {
				for (let childNode of this.scopesByNode[node.id].generateNodes_pointers()) {
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
			
			if (this.scopesByNode[node.id]) {
				for (let childNode of this.scopesByNode[node.id].generateNodes_cursor()) {
					yield childNode;
				}
			}
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
	}
}
