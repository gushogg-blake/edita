let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let cursorToTreeSitterPoint = require("modules/utils/treeSitter/cursorToTreeSitterPoint");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
let findSmallestNodeAtCharCursor = require("modules/utils/treeSitter/findSmallestNodeAtCharCursor");
let generateNodesOnLine = require("modules/utils/treeSitter/generateNodesOnLine");
let selectionFromNode = require("modules/utils/treeSitter/selectionFromNode");
let nodeGetters = require("modules/utils/treeSitter/nodeGetters");
let Range = require("./Range");

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
		this.scopeAndRangesByNode = {};
		this.injectionNodeByChildRange = new WeakMap();
		
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
			
			// trees with ERROR nodes can be broken, e.g. with incorrect
			// parent/child/sibling pointers, so count as a failed parse
			
			if (this.tree.rootNode.hasError()) {
				this.tree = null;
			}
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
			
			// trees with ERROR nodes can be broken, e.g. with incorrect
			// parent/child/sibling pointers, so count as a failed parse
			
			if (this.tree.rootNode.hasError()) {
				this.tree = null;
			}
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
		this.scopeByNode = {};
		this.scopeAndRangesByNode = {};
		
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
				let nodeRanges = nodes.map(node => this.rangesFromNode(node));
				let ranges = nodeRanges.flat();
				
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
				
				for (let i = 0; i < nodes.length; i++) {
					let node = nodes[i];
					let ranges = nodeRanges[i];
					
					this.scopeAndRangesByNode[node.id] = {scope, ranges};
					
					for (let range of ranges) {
						this.injectionNodeByChildRange.set(range, node);
					}
				}
			} else {
				for (let match of matches) {
					let injectionLang = base.langs.get(injection.lang(match));
					
					if (!injectionLang) {
						continue;
					}
					
					let node = match.injectionNode;
					let ranges = this.rangesFromNode(node);
					
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
					this.scopeAndRangesByNode[node.id] = {scope, ranges};
					
					for (let range of ranges) {
						this.injectionNodeByChildRange.set(range, node);
					}
				}
			}
		}
	}
	
	getVisibleScopes(selection) {
		let ranges = this.ranges.filter(function(range) {
			return Selection.isOverlapping(selection, range.selection);
		});
		
		if (ranges.length === 0) {
			return [];
		}
		
		return [
			{
				scope: this,
				ranges,
			},
			
			...this.scopes.reduce(function(scopes, scope) {
				return [...scopes, ...scope.getVisibleScopes(selection)];
			}, []),
		];
	}
	
	/*
	get ranges describing a node, taking into account our ranges.
	
	e.g. when creating new scope to inject javascript into a text node in
	a <script> tag in a php file, the ranges should take into account any
	holes in the parent (html) scope created by php tags.
	
	the ranges we end up with will be the intersections of the node's
	selection and our ranges.
	*/
	
	rangesFromNode(node) {
		let ranges = [];
		let nodeSelection = selectionFromNode(node);
		
		for (let parentRange of this.ranges) {
			let selection = Selection.intersection(nodeSelection, parentRange.selection);
			
			if (selection) {
				let startIndex = this.source.indexFromCursor(selection.start);
				let endIndex = this.source.indexFromCursor(selection.end);
				
				ranges.push(new Range(startIndex, endIndex, selection));
			}
		}
		
		return ranges;
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
			let rangeFromChild = scope._rangeFromCursor(cursor, _char);
			
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
	
	findSmallestNodeAtCharCursor(cursor) {
		return this.tree && findSmallestNodeAtCharCursor(this.tree.rootNode, cursor);
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
					lang: this.lang,
				};
			}
			
			startOffset = nodeGetters.endPosition(node).column;
			
			let {scope} = this.scopeAndRangesByNode[node.id] || {};
			
			if (scope) {
				for (let childNode of scope._generateNodesOnLine(lineIndex, startOffset, lang)) {
					yield childNode;
					
					startOffset = nodeGetters.endPosition(childNode.node).column;
				}
			}
		}
		
		for (let scope of this.scopes) {
			for (let childNode of scope._generateNodesOnLine(lineIndex, startOffset, lang)) {
				yield childNode;
				
				startOffset = nodeGetters.endPosition(childNode.node).column;
			}
		}
	}
	
	*generateNodesOnLine(lineIndex, lang=null) {
		for (let {node} of this._generateNodesOnLine(lineIndex, 0, lang)) {
			yield node;
		}
	}
	
	generateNodesOnLineWithLang(lineIndex, lang=null) {
		return this._generateNodesOnLine(lineIndex, 0, lang);
	}
}
