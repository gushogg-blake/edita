let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let cursorToTreeSitterPoint = require("modules/utils/treeSitter/cursorToTreeSitterPoint");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
let findSmallestNodeAtCharCursor = require("modules/utils/treeSitter/findSmallestNodeAtCharCursor");
let findFirstNodeOnOrAfterCursor = require("modules/utils/treeSitter/findFirstNodeOnOrAfterCursor");
let generateNodesOnLine = require("modules/utils/treeSitter/generateNodesOnLine");
let nodeUtils = require("modules/utils/treeSitter/nodeUtils");
let Range = require("./Range");

let {s} = Selection;

module.exports = class Scope {
	constructor(source, parent, lang, code, ranges) {
		this.source = source;
		this.parent = parent;
		this.lang = lang;
		this.code = code;
		
		this.tree = null;
		
		this.setRanges(ranges);
		
		this.scopes = [];
		this.scopesByNode = {};
		
		this.parse();
	}
	
	setRanges(ranges) {
		this.ranges = ranges;
		this.treeSitterRanges = ranges.map(Range.toTreeSitterRange);
		
		for (let range of ranges) {
			range.scope = this;
		}
	}
	
	linkRanges() {
		for (let range of this.ranges) {
			range.children = this.scopes.reduce((childRanges, scope) => {
				return [...childRanges, ...scope.ranges.filter((childRange) => {
					return this.rangeFromCharCursor(childRange.selection.start) === range;
				})];
			}, []);
		}
	}
	
	createTreeSitterParser() {
		let parser = new TreeSitter();
		let treeSitterLanguage = base.getTreeSitterLanguage(this.lang.code);
		
		if (!treeSitterLanguage) {
			// langs must be pre-initialised with base.initLanguage.
			
			throw "tree-sitter language not initialised";
		}
		
		parser.setLanguage(treeSitterLanguage);
		
		return parser;
	}
	
	parse() {
		if (this.source.noParse || this.lang.code === "plainText") {
			return;
		}
		
		//console.time("parse (" + this.lang.code + ")");
		
		try {
			let parser = this.createTreeSitterParser();
			
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
			let parser = this.createTreeSitterParser();
			
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
					
					this.scopesByNode[node.id] = scope;
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
					this.scopesByNode[node.id] = scope;
				}
			}
		}
		
		this.linkRanges();
	}
	
	getVisibleScopes(selection) {
		let ranges = this.ranges.filter(function(range) {
			return Selection.isOverlapping(selection, range.selection);
		});
		
		if (ranges.length === 0) {
			return [];
		}
		
		let children = this.scopes.reduce(function(scopes, scope) {
			return [...scopes, ...scope.getVisibleScopes(selection)];
		}, []);
		
		return [
			{
				scope: this,
				ranges,
				
				injectionRanges: children.reduce(function(ranges, child) {
					return [...ranges, ...child.ranges];
				}, []),
			},
			
			...children,
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
		let nodeSelection = nodeUtils.selection(node);
		
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
	
	_rangeFromCursor(cursor, _char) {
		return this.ranges.find(range => _char ? range.containsCharCursor(cursor) : range.containsCursor(cursor));
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
	
	findFirstNodeOnOrAfterCursor(cursor) {
		return this.tree && findFirstNodeOnOrAfterCursor(this.tree.rootNode, cursor);
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
			
			startOffset = nodeUtils.endPosition(node).column;
			
			let scope = this.scopesByNode[node.id];
			
			if (scope) {
				for (let childNode of scope._generateNodesOnLine(lineIndex, startOffset, lang)) {
					yield childNode;
					
					startOffset = nodeUtils.endPosition(childNode.node).column;
				}
			}
		}
		
		for (let scope of this.scopes) {
			for (let childNode of scope._generateNodesOnLine(lineIndex, startOffset, lang)) {
				yield childNode;
				
				startOffset = nodeUtils.endPosition(childNode.node).column;
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
