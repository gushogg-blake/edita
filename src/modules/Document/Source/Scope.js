let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let next = require("modules/utils/treeSitter/next");
let cursorToTreeSitterPoint = require("modules/utils/treeSitter/cursorToTreeSitterPoint");
let findFirstNodeToRender = require("modules/utils/treeSitter/findFirstNodeToRender");
let findFirstNodeOnLine = require("modules/utils/treeSitter/findFirstNodeOnLine");
let findFirstNodeOnOrAfterCursor = require("modules/utils/treeSitter/findFirstNodeOnOrAfterCursor");
let generateNodesOnLine = require("modules/utils/treeSitter/generateNodesOnLine");
let nodeGetters = require("modules/utils/treeSitter/nodeGetters");
let Range = require("./Range");

let {s} = Selection;

module.exports = class Scope {
	constructor(parent, lang, code, ranges) {
		this.parent = parent;
		this.lang = lang;
		this.code = code;
		this.ranges = ranges;
		this.treeSitterRanges = ranges.map(Range.toTreeSitterRange);
		
		this.tree = null;
		
		this.scopes = [];
		this.scopesByNode = {};
		this.scopeAndRangeByNode = {};
		
		this.parse();
	}
	
	parse() {
		//console.time("parse (" + this.lang.code + ")");
		
		try {
			let parser = new TreeSitter();
			
			parser.setLanguage(base.getTreeSitterLanguage(this.lang.code));
			
			this.tree = parser.parse(this.code, null, {
				includedRanges: this.treeSitterRanges,
			});
		} catch (e) {
			this.tree = null;
			
			console.error("Parse error");
			console.error(e);
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
		this.ranges = newRanges;
		this.treeSitterRanges = this.ranges.map(Range.toTreeSitterRange);
		
		if (!this.tree) {
			return this.parse();
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
			
			console.error("Parse error");
			console.error(e);
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
			}, (existingScope, ranges) => {
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
					scope = new Scope(this, injectionLang, this.code, ranges);
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
						scope = new Scope(this, injectionLang, this.code, [range]);
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
	
	findFirstNodeToRender(lineIndex) {
		if (!this.tree) {
			return {};
		}
		
		let node = findFirstNodeToRender(this.tree.rootNode, lineIndex);
		let childScope = this.scopesByNode[node.id];
		
		if (childScope && childScope.tree) {
			return childScope.findFirstNodeToRender(lineIndex);
		}
		
		return {
			scope: this,
			range: this.findContainingRange(node),
			node,
		};
	}
	
	findFirstNodeOnLine(lineIndex) {
		if (!this.tree) {
			return {};
		}
		
		let node = findFirstNodeOnLine(this.tree.rootNode, lineIndex);
		
		if (!node) {
			return {};
		}
		
		return {
			scope: this,
			range: this.findContainingRange(node),
			node,
		};
	}
	
	findFirstNodeOnOrAfterCursor(cursor) {
		if (!this.tree) {
			return {};
		}
		
		let node = findFirstNodeOnOrAfterCursor(this.tree.rootNode, cursor);
		
		if (!node) {
			return {};
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
			
			if (!scope.tree) {
				return this.nextAfterRange(range);
			}
			
			return scope.firstInRange(range);
		}
		
		let nextNode = next(node);
		
		while (nextNode && !range.containsNode(nextNode)) {
			if (!range.containsNodeStart(nextNode)) {
				nextNode = null;
				
				break;
			}
			
			nextNode = next(nextNode);
		}
		
		if (!nextNode) {
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
		let node = findFirstNodeOnOrAfterCursor(this.tree.rootNode, range.selection.start);
		
		return {
			scope: this,
			range,
			node,
		};
	}
	
	nextAfterRange(prevRange) {
		let node = findFirstNodeOnOrAfterCursor(this.tree.rootNode, prevRange.selection.end);
		let range = node && this.findContainingRange(node);
		
		return {
			scope: this,
			range,
			node,
		};
	}
	
	langFromCursor(cursor) {
		return this.scopeFromCursor(cursor)?.lang;
	}
	
	scopeFromCursor(cursor) {
		if (!this.ranges.some(range => Selection.cursorIsWithinOrNextToSelection(range.selection, cursor))) {
			return null;
		}
		
		for (let scope of this.scopes) {
			let scopeFromChild = scope.scopeFromCursor(cursor);
			
			if (scopeFromChild) {
				return scopeFromChild;
			}
		}
		
		return this;
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
	
	*_generateNodesOnLine(withLang, lineIndex, startOffset=0) {
		if (!this.tree) {
			return;
		}
		
		for (let node of generateNodesOnLine(this.tree.rootNode, lineIndex, startOffset)) {
			yield withLang ? {
				node,
				lang: this.lang,
			} : node;
			
			startOffset = nodeGetters.endPosition(node).column;
			
			let scope = this.scopesByNode[node.id];
			
			if (scope) {
				for (let childNode of scope._generateNodesOnLine(withLang, lineIndex, startOffset)) {
					yield childNode;
					
					startOffset = nodeGetters.endPosition(withLang ? childNode.node : childNode).column;
				}
			}
		}
		
		for (let scope of this.scopes) {
			for (let childNode of scope._generateNodesOnLine(withLang, lineIndex, startOffset)) {
				yield childNode;
				
				startOffset = nodeGetters.endPosition(withLang ? childNode.node : childNode).column;
			}
		}
	}
	
	generateNodesOnLine(lineIndex, startOffset=0) {
		return this._generateNodesOnLine(false, lineIndex, startOffset);
	}
	
	generateNodesOnLineWithLang(lineIndex, startOffset=0) {
		return this._generateNodesOnLine(true, lineIndex, startOffset);
	}
}
