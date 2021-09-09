let Selection = require("modules/utils/Selection");
let advanceCursor = require("./utils/treeSitter/advanceCursor");
let next = require("./utils/treeSitter/next");
let cursorToTreeSitterPoint = require("./utils/treeSitter/cursorToTreeSitterPoint");
let findFirstNodeToRender = require("./utils/treeSitter/findFirstNodeToRender");
let findFirstNodeOnOrAfterCursor = require("./utils/treeSitter/findFirstNodeOnOrAfterCursor");
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
		
		this.scopeAndRangeByNode = {};
		
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
					if (capture.name === "injectionNode" && capture.node.text.length > 0) {
						return capture.node;
					}
				}
				
				return null;
			}).filter(Boolean);
			
			if (injection.combined) {
				let injectionLang = base.langs.get(injection.lang);
				
				if (injectionLang) {
					let ranges = nodes.map(Range.fromNode);
					let scope = new Scope(this, injectionLang, this.code, ranges);
					
					this.scopes.push(scope);
					
					for (let range of ranges) {
						this.scopesByCursor[range.cursorKey] = scope;
					}
					
					for (let node of nodes) {
						this.scopesByNode[node.id] = scope;
					}
					
					for (let i = 0; i < nodes.length; i++) {
						let node = nodes[i];
						let range = ranges[i];
						
						this.scopeAndRangeByNode[node.id] = {
							scope,
							range,
						};
					}
				}
			} else {
				for (let node of nodes) {
					let injectionLang = base.langs.get(injection.lang(node));
					
					if (injectionLang) {
						let range = Range.fromNode(node);
						let scope = new Scope(this, injectionLang, this.code, [range]);
						
						this.scopes.push(scope);
						this.scopesByCursor[range.cursorKey] = scope;
						this.scopesByNode[node.id] = scope;
						
						this.scopeAndRangeByNode[node.id] = {
							scope,
							range,
						};
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
			if (range.containsNode(node)) {
				return range;
			}
		}
	}
	
	next(node, range) {
		let childScopeAndRange = this.scopeAndRangeByNode[node.id];
		
		if (childScopeAndRange) {
			let {scope, range} = childScopeAndRange;
			
			return scope.firstInRange(range);
		}
		
		let nextNode = next(node);
		let nextRange = nextNode && this.findContainingRange(nextNode);
		
		if (!nextNode || nextRange !== range) {
			if (this.parent) {
				return this.parent.nextAfterRange(range);
			} else {
				return {
					scope: this,
					range: null,
					node: null,
				};
			}
		}
		
		return {
			scope: this,
			range,
			node: nextNode,
		};
	}
	
	firstInRange(range) {
		let node = findFirstNodeOnOrAfterCursor(this.tree, range.selection.start);
		
		return {
			scope: this,
			range,
			node,
		};
	}
	
	nextAfterRange(prevRange) {
		let node = findFirstNodeOnOrAfterCursor(this.tree, prevRange.selection.end);
		let range = node && this.findContainingRange(node);
		
		return {
			scope: this,
			range,
			node,
		};
	}
	
	langFromCursor(cursor) {
		if (!this.ranges.some(range => Selection.cursorIsWithinOrNextToSelection(range.selection, cursor))) {
			return null;
		}
		
		for (let scope of this.scopes) {
			let langFromChild = scope.langFromCursor(cursor);
			
			if (langFromChild) {
				return langFromChild;
			}
		}
		
		return this.lang;
	}
	
	/*
	generate nodes on line
	
	child scopes that are encountered within our nodes are called immediately
	so that the nodes are in order, then all child scopes are called in case
	there are child scopes with nodes on the line and their parents are not
	on the line (so they wouldn't be processed in the first step)
	
	e.g.
	
	<script>let a = 123;</script>
	
	the outermost (html) scope would yield the script tag, the start tag
	& children, then the raw_text.  this would have a javascript child scope
	associated with it, so we call down to it immediately and yield its nodes
	starting at offset 8.  Then we come back out to the main scope and carry
	on with the end tag & children.  Then we iterate over the child scopes
	again, so call the javascript scope again but this time with startOffset
	= 29, so it doesn't yield anything.
	
	An example where the child scopes are not found by our nodes:
	
	<script>
		let a = `
			${123}
		`;
	</script>
	
	generating for the ${123} line: the outer scope has no nodes on that line
	(the raw_text for the script starts above).  startOffset is left at 0,
	and we iterate over all scopes, calling the javascript scope with
	startOffset = 0.
	*/
	
	*generateNodesOnLine(lineIndex, startOffset=0) {
		for (let node of generateNodesOnLine(this.tree, lineIndex, startOffset)) {
			yield node;
			
			startOffset = node.endPosition.column;
			
			let scope = this.scopesByNode[node.id];
			
			if (scope) {
				for (let childNode of scope.generateNodesOnLine(lineIndex, startOffset)) {
					yield childNode;
					
					startOffset = childNode.endPosition.column;
				}
			}
		}
		
		for (let scope of this.scopes) {
			for (let childNode of scope.generateNodesOnLine(lineIndex, startOffset)) {
				yield childNode;
				
				startOffset = childNode.endPosition.column;
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
