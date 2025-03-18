import _typeof from "utils/typeof";
import {groupBy} from "utils/array";
import {removeInPlace} from "utils/array";
import mapArrayToObject from "utils/mapArrayToObject";
import Selection, {s} from "modules/Selection";
import Tree from "modules/Tree";
import Range from "./Range";

function getInjectionLangCode(injection, result) {
	return _typeof(injection.lang) === "Function" ? injection.lang(result) : injection.lang;
}

export default class Scope {
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
			|| !this.lang.treeSitterLanguage
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
	
	we can also exclude children of the node - added to support markdown
	as inline nodes (where markdown_inline is injected) can have children.
	see langs/markdown/index.js for more details.
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
	generate nodes starting on line
	
	NOTE these may not be in lexical order when there are child scopes
	
	a prev implementation tried yielding nodes from child scopes as they
	were encountered, but since parent and child scopes don't always start
	on the same line and there are situations where the parent scope
	doesn't have any nodes on the same line as child scope nodes, we just
	yield all our nodes then call down to child scopes. this means that
	nodes won't always be in lexical order, but we'll definitely see all
	the nodes once.
	
	in this case the prev approach would work fine (if implemented correctly...):
	
	<script>let a = 123;</script>
	
	but here, for the ${123} line, the outer HTML scope doesn't have any nodes
	starting on the line so nothing would happen:
	
	<script>
		let a = `
			${123}
		`;
	</script>
	
	I tried a hacky solution of updating startOffset and going through the
	child scopes after the main loop but it didn't really make sense
	*/
	
	*_generateNodesStartingOnLine(lineIndex, startOffset, lang=null) {
		if (!this.tree) {
			return;
		}
		
		for (let node of this.tree.generateNodesStartingOnLine(lineIndex, startOffset)) {
			if (!lang || this.lang === lang) {
				yield node;
			}
		}
		
		for (let scope of this.scopes) {
			yield* scope.generateNodesStartingOnLine(lineIndex, startOffset, lang);
		}
	}
	
	generateNodesStartingOnLine(lineIndex, lang=null) {
		return this._generateNodesStartingOnLine(lineIndex, 0, lang);
	}
	
	allScopes() {
		return this.scopes.concat(...this.scopes.map(scope => scope.allScopes()));
	}
}
