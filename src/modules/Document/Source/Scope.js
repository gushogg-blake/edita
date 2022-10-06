let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let next = require("modules/utils/treeSitter/next");
let cursorToTreeSitterPoint = require("modules/utils/treeSitter/cursorToTreeSitterPoint");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
let findFirstNodeOnOrAfterCursor = require("modules/utils/treeSitter/findFirstNodeOnOrAfterCursor");
let findFirstNodeAfterCursor = require("modules/utils/treeSitter/findFirstNodeAfterCursor");
let findSmallestNodeAtCursor = require("modules/utils/treeSitter/findSmallestNodeAtCursor");
let generateNodesOnLine = require("modules/utils/treeSitter/generateNodesOnLine");
let nodeGetters = require("modules/utils/treeSitter/nodeGetters");
let Range = require("./Range");
let NodeWithRange = require("./NodeWithRange");

let {s} = Selection;

module.exports = class Scope {
	constructor(source, parent, lang, code, ranges) {
		this.source = source;
		this.parent = parent;
		this.lang = lang;
		this.code = code;
		
		this.setRanges(ranges);
		
		this.tree = null;
		
		this.scopes = [];
		this.scopesByNode = {};
		this.scopeAndRangeByNode = {};
		
		this.setRangeScopePointers();
		
		this.parse();
	}
	
	setRanges(ranges) {
		this.ranges = ranges;
		this.treeSitterRanges = ranges.map(Range.toTreeSitterRange);
		
		for (let range of ranges) {
			range.scope = this;
		}
	}
	
	parse() {
		if (this.source.noParse || this.lang.code === "plainText") {
			return;
		}
		
		//console.time("parse (" + this.lang.code + ")");
		
		try {
			let parser = new TreeSitter();
			
			parser.setLanguage(base.getTreeSitterLanguage(this.lang.code));
			
			this.tree = parser.parse(this.code, null, {
				includedRanges: this.treeSitterRanges,
			});
		} catch (e) {
			this.tree = null;
			
			//console.error("Parse error");
			//console.error(e);
		} finally {
			this.processInjections();
		}
		
		//console.timeEnd("parse (" + this.lang.code + ")");
	}
	
	edit(edit, index, newRanges, code) {
		let {
			selection,
			newSelection,
			string,
			replaceWith,
		} = edit;
		
		this.code = code;
		
		this.setRanges(newRanges);
		
		if (!this.tree) {
			this.parse();
			
			return;
		}
		
		let existingScopes = this.scopes;
		
		try {
			let parser = new TreeSitter();
			
			parser.setLanguage(base.getTreeSitterLanguage(this.lang.code));
			
			this.tree.edit({
				startPosition: cursorToTreeSitterPoint(selection.start),
				startIndex: index,
				oldEndPosition: cursorToTreeSitterPoint(selection.end),
				oldEndIndex: index + string.length,
				newEndPosition: cursorToTreeSitterPoint(newSelection.end),
				newEndIndex: index + replaceWith.length,
			});
			
			this.tree = parser.parse(this.code, this.tree, {
				includedRanges: this.treeSitterRanges,
			});
		} catch (e) {
			this.tree = null;
			
			//console.error("Parse error");
			//console.error(e);
		} finally {
			this.processInjections(function(injectionLang, firstRange) {
				let {start} = firstRange.selection;
				
				return existingScopes.find(function(scope) {
					if (scope.lang !== injectionLang) {
						return false;
					}
					
					let existingStart = scope.ranges[0].selection.start;
					let existingSelectionEdited = Selection.edit(s(existingStart), selection, newSelection);
					
					if (!existingSelectionEdited) {
						return false;
					}
					
					return Cursor.equals(start, existingSelectionEdited.start);
				});
			}, function(existingScope, ranges) {
				existingScope.edit(edit, index, ranges, code);
			});
		}
	}
	
	processInjections(findExistingScope=null, editExistingScope=null) {
		this.scopes = [];
		this.scopesByNode = {};
		this.scopeAndRangeByNode = {};
		
		if (!this.tree) {
			return;
		}
		
		for (let injection of this.lang.injections) {
			let matches = injection.query.matches(this.tree.rootNode).map(function(match) {
				let captures = {};
				
				for (let capture of match.captures) {
					captures[capture.name] = capture.node;
				}
				
				return captures;
			}).filter(function(match) {
				return match.injectionNode && match.injectionNode.text.length > 0;
			});
			
			if (matches.length === 0) {
				continue;
			}
			
			if (injection.combined) {
				let injectionLang = base.langs.get(injection.lang);
				
				if (!injectionLang) {
					continue;
				}
				
				let nodes = matches.map(match => match.injectionNode);
				let ranges = nodes.map(Range.fromNode);
				
				let existingScope;
				let scope;
				
				if (findExistingScope) {
					existingScope = findExistingScope(injectionLang, ranges[0]);
				}
				
				if (existingScope) {
					editExistingScope(existingScope, ranges);
					
					scope = existingScope;
				} else {
					scope = new Scope(this.source, this, injectionLang, this.code, ranges);
				}
				
				this.scopes.push(scope);
				
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
			} else {
				for (let match of matches) {
					let injectionLang = base.langs.get(injection.lang(match));
					
					if (!injectionLang) {
						continue;
					}
					
					let node = match.injectionNode;
					let range = Range.fromNode(node);
					
					let existingScope;
					let scope;
					
					if (findExistingScope) {
						existingScope = findExistingScope(injectionLang, range);
					}
					
					if (existingScope) {
						editExistingScope(existingScope, [range]);
						
						scope = existingScope;
					} else {
						scope = new Scope(this.source, this, injectionLang, this.code, [range]);
					}
					
					this.scopes.push(scope);
					this.scopesByNode[node.id] = scope;
					
					this.scopeAndRangeByNode[node.id] = {
						scope,
						range,
					};
				}
			}
		}
	}
	
	findContainingRange(node) {
		for (let range of this.ranges) {
			if (range.containsNode(node)) {
				return range;
			}
		}
	}
	
	/*
	helper function for the above
	*/
	
	getInjectionParent(node) {
		return this.findSmallestNodeAtCursor(treeSitterPointToCursor(node.startPosition));
	}
	
	firstInRange(range) {
		let node = findFirstNodeOnOrAfterCursor(this.tree.rootNode, range.selection.start);
		let childScopeAndRange = this.scopeAndRangeByNode[node.id];
		
		if (childScopeAndRange) {
			let {scope, range} = childScopeAndRange;
			
			if (!scope.tree) {
				return this.nextAfterRange(range);
			}
			
			return scope.firstInRange(range);
		}
		
		return new NodeWithRange(range, node);
	}
	
	nextAfterRange(prevRange) {
		let node = findFirstNodeOnOrAfterCursor(this.tree.rootNode, prevRange.selection.end);
		let range = node && this.findContainingRange(node);
		
		return new NodeWithRange(range, node);
	}
	
	langFromCursor(cursor) {
		return this.rangeFromCursor(cursor).lang;
	}
	
	_rangeFromCursor(cursor, _char) {
		let range = this.ranges.find(range => _char ? range.containsCharCursor(cursor) : range.containsCursor(cursor));
		
		if (!range) {
			return null;
		}
		
		for (let scope of this.scopes) {
			let rangeFromChild = scope.rangeFromCursor(cursor);
			
			if (rangeFromChild) {
				return rangeFromChild;
			}
		}
		
		return range;
	}
	
	rangeFromCursor(cursor) {
		return this._rangeFromCursor(cursor, false);
	}
	
	rangeFromCharCursor(cursor) {
		return this._rangeFromCursor(cursor, true);
	}
	
	findFirstNodeOnOrAfterCursor(cursor) {
		let node = this.tree && findFirstNodeOnOrAfterCursor(this.tree.rootNode, cursor);
		
		if (!node) {
			return this.parent?.findFirstNodeAfterCursor(cursor);
		}
		
		return new NodeWithRange(this.findContainingRange(node), node);
	}
	
	findFirstNodeAfterCursor(cursor) {
		let node = this.tree && findFirstNodeAfterCursor(this.tree.rootNode, cursor);
		
		if (!node) {
			return this.parent?.findFirstNodeAfterCursor(cursor);
			} else {
				return null;
			}
		}
		
		return {
			scope: this,
			range: this.findContainingRange(node),
			node,
		};
	}
	
	findFirstNodeOnOrAfterCursor(cursor) {
		let node = this.tree && findSmallestNodeAtCursor(this.tree.rootNode, cursor);
		
		if (!node) {
			if (this.parent) {
				return this.parent.findSmallestNodeAtCursor(cursor);
			} else {
				return null;
			}
		}
		
		return {
			scope: this,
			range: this.findContainingRange(node),
			node,
		};
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
	
	*_generateNodesOnLine(lineIndex, startOffset, lang) {
		if (!this.tree) {
			return;
		}
		
		for (let node of generateNodesOnLine(this.tree.rootNode, lineIndex, startOffset)) {
			if (!lang || this.lang === lang) {
				yield {
					node,
					scope: this,
				};
			}
			
			startOffset = nodeGetters.endPosition(node).column;
			
			let scope = this.scopesByNode[node.id];
			
			if (scope) {
				for (let childNode of scope._generateNodesOnLine(lineIndex, startOffset, lang)) {
					yield childNode;
					
					startOffset = nodeGetters.endPosition(childNode.node).column;
				}
			}
		}
		
		for (let scope of this.scopes) {
			for (let childNode of scope._generateNodesOnLine(lineIndex, startOffset, withScope, lang)) {
				yield childNode;
				
				startOffset = nodeGetters.endPosition(childNode.node).column;
			}
		}
	}
	
	generateNodesOnLine(lineIndex, lang=null) {
		return this._generateNodesOnLine(lineIndex, 0, lang);
	}
	
	generateNodesWithScopeOnLine(lineIndex) {
		return this._generateNodesOnLine(lineIndex, 0, null);
	}
}
