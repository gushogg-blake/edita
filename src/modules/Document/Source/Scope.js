let _typeof = require("utils/typeof");
let groupBy = require("utils/array/groupBy");
let {removeInPlace} = require("utils/arrayMethods");
let mapArrayToObject = require("utils/mapArrayToObject");
let Selection = require("modules/Selection");
let Tree = require("modules/Tree");
let Range = require("./Range");

function getInjectionLangCode(injection, result) {
	return _typeof(injection.lang) === "Function" ? injection.lang(result) : injection.lang;
}

module.exports = class Scope {
	constructor(source, parent, lang, ranges) {
		this.source = source;
		this.parent = parent;
		this.lang = lang;
		
		this.tree = null;
		
		this.setRanges(ranges);
		
		this.scopes = [];
		this.scopesByNode = {};
		
		this.parse();
	}
	
	get string() {
		return this.source.string;
	}
	
	get document() {
		return this.source.document;
	}
	
	setRanges(ranges) {
		this.ranges = ranges;
		
		for (let range of ranges) {
			range.scope = this;
		}
	}
	
	parse(editedTree=null, findExistingScope=null, editExistingScope=null) {
		if (
			this.document.noParse
			|| this.lang.code === "plaintext"
		) {
			return;
		}
		
		if (base.getPref("dev.timing.parse")) {
			console.time("parse (" + this.lang.code + ")");
		}
		
		try {
			this.tree = Tree.parse(this.lang, this.string, editedTree, this.ranges);
			
			/*
			ERROR nodes can be incorrectly linked, which can cause infinite loops in
			rendering. try to detect issues like this and throw a parse error instead.
			*/
			
			let errors = this.tree.query(this.lang.queries.error);
			
			for (let [{node}] of errors) {
				if (!node.parent || node.parent.equals(node)) { // obviously, a node shouldn't be its own parent
					let msg = "ERROR node incorrectly linked or root node is ERROR";
					
					console.log(msg, node);
					
					throw msg;
				}
			}
		} catch (e) {
			this.tree = null;
			
			console.log("Parse error");
			console.error(e);
		} finally {
			this.processInjections(findExistingScope, editExistingScope);
		}
		
		if (base.getPref("dev.timing.parse")) {
			console.timeEnd("parse (" + this.lang.code + ")");
		}
	}
	
	edit(edit, index, newRanges) {
		this.setRanges(newRanges);
		
		/*
		HACK reparseOnEdit - the codepatterns grammar for some reason doesn't
		recognise a regex starting at col 0 if it's typed out character by
		character, presumably because the parser/tree gets into a broken state
		*/
		
		if (this.lang.reparseOnEdit) {
			this.parse();
			
			return;
		}
		
		if (!this.tree) {
			this.parse();
			
			return;
		}
		
		try {
			this.tree.edit(edit, index);
		} catch (e) {
			console.log("Tree edit error");
			console.error(e);
			
			this.parse();
			
			return;
		}
		
		let existingScopes = this.scopes;
			
		this.parse(this.tree, function(injectionLang, ranges) {
			/*
			if there's an existing scope for the lang with the same ranges
			(adjusted for the edit), we can edit it. e.g. if we have an html
			document with a <script> tag and we make some edits above, below,
			or within it, and the resulting html document still has a
			javascript injection at the same place, then structure has remained
			the same and we can apply the edit to the inner javascript scope.
			
			if the edit changes the structure so that the injection doesn't have
			the same ranges, we don't treat it as the "same" injection and we
			create another one, even though some of the code in it may still be
			the same and it might be "the same script tag" from the author's
			point of view.
			
			this used to be a less strict check where as long as the start of
			the first range was the same we would keep the injection, but this
			caused issues with inner scopes not getting updated properly, for example:
			
			<script>
			let a = `
			${<? foreach($a as $b):  ?> 123 <? endforeach; }
			`;
			</script>
			
			adding the closing ?> to fix the tag with endforeach; and then adding
			some text to the end of the javascript template string, the text at
			the end wouldn't be highlighted as a string.
			*/
			
			return existingScopes.find(function(scope) {
				if (scope.lang !== injectionLang) {
					return false;
				}
				
				if (scope.ranges.length !== ranges.length) {
					return false;
				}
				
				for (let i = 0; i < scope.ranges.length; i++) {
					let existingRange = scope.ranges[i];
					let range = ranges[i];
					
					let existingSelectionEdited = existingRange.selection.edit(edit);
					
					if (!existingSelectionEdited || !existingSelectionEdited.equals(range.selection)) {
						return false;
					}
				}
				
				return true;
			});
		}, function(existingScope, ranges) {
			existingScope.edit(edit, index, ranges);
			
			removeInPlace(existingScopes, existingScope);
		});
	}
	
	processInjections(findExistingScope, useExistingScope) {
		this.scopes = [];
		this.scopesByNode = {};
		
		if (!this.tree) {
			return;
		}
		
		for (let injection of this.lang.injections) {
			let results = this.tree.captureSingle(injection.query).filter(result => result.injectionNode?.text.length > 0);
			
			if (results.length === 0) {
				continue;
			}
			
			if (injection.combined) {
				let resultsByLangCode = groupBy(results, result => getInjectionLangCode(injection, result));
				
				for (let [langCode, results] of Object.entries(resultsByLangCode)) {
					let nodes = results.map(result => result.injectionNode);
					let injectionLang = base.langs.get(langCode);
					
					if (!injectionLang) {
						continue;
					}
					
					let nodeRanges = nodes.map(node => this.rangesFromNode(node, injection.excludeChildren));
					let ranges = nodeRanges.flat();
					
					let existingScope;
					let scope;
					
					if (findExistingScope) {
						existingScope = findExistingScope(injectionLang, ranges);
					}
					
					if (existingScope) {
						useExistingScope(existingScope, ranges);
						
						scope = existingScope;
					} else {
						scope = new Scope(this.source, this, injectionLang, ranges);
					}
					
					this.scopes.push(scope);
					
					for (let i = 0; i < nodes.length; i++) {
						let node = nodes[i];
						let ranges = nodeRanges[i];
						
						this.scopesByNode[node.id] = scope;
					}
				}
			} else {
				for (let result of results) {
					let node = result.injectionNode;
					let injectionLang = base.langs.get(getInjectionLangCode(injection, result));
					
					if (!injectionLang) {
						continue;
					}
					
					let ranges = this.rangesFromNode(node, injection.excludeChildren);
					
					let existingScope;
					let scope;
					
					if (findExistingScope) {
						existingScope = findExistingScope(injectionLang, ranges);
					}
					
					if (existingScope) {
						useExistingScope(existingScope, ranges);
						
						scope = existingScope;
					} else {
						scope = new Scope(this.source, this, injectionLang, ranges);
					}
					
					this.scopes.push(scope);
					this.scopesByNode[node.id] = scope;
				}
			}
		}
	}
	
	query(query, startCursor=null) {
		return this.tree.query(query, startCursor);
	}
	
	/*
	NOTE this filters child ranges twice and will be slow for
	documents with many ranges. solution would be to treat
	ranges more like nodes - find visible ones in O(log n) and
	possibly link them with .children and/or sibling pointers
	*/
	
	getVisibleScopes(selection) {
		let ranges = this.ranges.filter(range => selection.overlaps(range.selection));
		
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
				
				injectionRanges: this.scopes.reduce(function(ranges, scope) {
					return [...ranges, ...scope.ranges.filter(range => selection.overlaps(range.selection))];
				}, []).sort(function(a, b) {
					return a.startIndex - b.startIndex;
				}),
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
	
	we can also exclude children of the node - added to support
	https://github.com/MDeiml/tree-sitter-markdown/
	*/
	
	rangesFromNode(node, excludeChildren=false) {
		let ranges = [];
		let selections = excludeChildren ? node.selectionsExcludingChildren() : [node.selection];
		
		for (let parentRange of this.ranges) {
			for (let candidateSelection of selections) {
				let selection = Selection.intersection(candidateSelection, parentRange.selection);
				
				if (selection) {
					let startIndex = this.source.indexFromCursor(selection.start);
					let endIndex = this.source.indexFromCursor(selection.end);
					
					ranges.push(new Range(startIndex, endIndex, selection));
				}
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
		return this.tree?.smallestAtChar(cursor) || null;
	}
	
	findFirstNodeOnOrAfterCursor(cursor) {
		return this.tree?.firstOnOrAfter(cursor) || null;
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
	
	*_generateNodesOnLine(lineIndex, startOffset, lang=null) {
		if (!this.tree) {
			return;
		}
		
		for (let node of this.tree.generateNodesOnLine(lineIndex, startOffset)) {
			if (!lang || this.lang === lang) {
				yield node;
			}
			
			startOffset = node.end.offset;
			
			let scope = this.scopesByNode[node.id];
			
			if (scope) {
				for (let childNode of scope.generateNodesOnLine(lineIndex, startOffset, lang)) {
					yield childNode;
					
					startOffset = childNode.end.offset;
				}
			}
		}
		
		for (let scope of this.scopes) {
			for (let childNode of scope.generateNodesOnLine(lineIndex, startOffset, lang)) {
				yield childNode;
				
				startOffset = childNode.end.offset;
			}
		}
	}
	
	generateNodesOnLine(lineIndex, lang=null) {
		return this._generateNodesOnLine(lineIndex, 0, lang);
	}
}
