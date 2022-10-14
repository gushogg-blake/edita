let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let next = require("modules/utils/treeSitter/next");
let nodeGetters = require("modules/utils/treeSitter/nodeGetters");
let Scope = require("./Scope");
let Range = require("./Range");
let Line = require("./Line");
let NodeWithRange = require("./NodeWithRange");

let {s} = Selection;
let {c} = Cursor;

module.exports = class {
	constructor(string, noParse) {
		this.string = string;
		this.noParse = noParse;
	}
	
	init(fileDetails) {
		this.fileDetails = fileDetails;
		this.lang = fileDetails.lang;
		
		this.parse();
	}
	
	createLines() {
		this.lines = [];
		
		let {fileDetails} = this;
		let lineStrings = this.string.split(fileDetails.newline);
		let lineStartIndex = 0;
		
		for (let lineString of lineStrings) {
			this.lines.push(new Line(lineString, fileDetails, lineStartIndex));
			
			lineStartIndex += lineString.length + fileDetails.newline.length;
		}
	}
	
	parse() {
		this.createLines();
		
		this.rootScope = new Scope(this, null, this.lang, this.string, [this.getContainingRange()]);
	}
	
	edit(edit) {
		//console.time("edit");
		
		let {
			selection,
			string,
			replaceWith,
		} = edit;
		
		let index = this.indexFromCursor(Selection.sort(selection).start);
		
		this.string = this.string.substr(0, index) + replaceWith + this.string.substr(index + string.length);
		
		this.createLines();
		
		this.rootScope.edit(edit, index, [this.getContainingRange()], this.string);
		
		//console.timeEnd("edit");
	}
	
	getVisibleScopes(startLineIndex, endLineIndex) {
		return this.rootScope.getVisibleScopes(startLineIndex, endLineIndex);
	}
	
	generateNodesOnLine(lineIndex, lang=null) {
		return this.rootScope.generateNodesOnLine(lineIndex, lang);
	}
	
	generateNodesOnLineWithLang(lineIndex, lang=null) {
		return this.rootScope.generateNodesOnLineWithLang(lineIndex, lang);
	}
	
	findFirstNodeOnOrAfterCursor(cursor) {
		if (Cursor.equals(cursor, this.cursorAtEnd())) {
			return null;
		}
		
		let {scope} = this.rangeFromCharCursor(cursor);
		let node = scope.findFirstNodeOnOrAfterCursor(cursor);
		
		while (!node) {
			scope = scope.parent;
			
			if (!scope) {
				break;
			}
			
			node = scope.findFirstNodeOnOrAfterCursor(cursor);
		}
		
		if (!node) {
			return null;
		}
		
		return new NodeWithRange(scope.findRangeContainingStart(node), node);
	}
	
	findFirstNodeAfterCursor(cursor) {
		if (Cursor.equals(cursor, this.cursorAtEnd())) {
			return null;
		}
		
		let {scope} = this.rangeFromCharCursor(cursor);
		let node = scope.findFirstNodeAfterCursor(cursor);
		
		while (!node) {
			scope = scope.parent;
			
			if (!scope) {
				break;
			}
			
			node = scope.findFirstNodeAfterCursor(cursor);
		}
		
		if (!node) {
			return null;
		}
		
		return new NodeWithRange(scope.findRangeContainingStart(node), node);
	}
	
	findSmallestNodeAtCharCursor(cursor) {
		if (Cursor.equals(cursor, this.cursorAtEnd())) {
			return null;
		}
		
		let {scope} = this.rangeFromCharCursor(cursor);
		let node = scope.findSmallestNodeAtCharCursor(cursor);
		
		while (!node) {
			scope = scope.parent;
			
			if (!scope) {
				break;
			}
			
			node = scope.findSmallestNodeAtCharCursor(cursor);
		}
		
		if (!node) {
			return null;
		}
		
		return new NodeWithRange(scope.findRangeContainingStart(node), node);
	}
	
	/*
	given a NodeWithRange, get the next NodeWithRange in the document
	*/
	
	nextNodeWithRange(nodeWithRange) {
		let {scope, range, node} = nodeWithRange;
		let childScopeAndRanges = scope.scopeAndRangesByNode[node.id];
		
		if (childScopeAndRanges) {
			let {scope, ranges} = childScopeAndRanges;
			
			if (scope.tree) {
				return scope.firstInRange(ranges[0]);
			}
		}
		
		let nextNode = next(node);
		
		if (!nextNode || !range.containsNodeStart(nextNode)) {
			return scope.parent?.nextAfterRange(range);
		}
		
		return new NodeWithRange(range, nextNode);
	}
	
	/*
	given a nodeWithRange in this scope, get its parent. for example:
	
	<script>
		let a = 123;
	</script>
	
	For the root node in the javascript scope, the parent is the raw_text node
	in the script tag in the html scope.
	*/
	
	parentNodeWithRange(nodeWithRange) {
		let {scope, range, node} = nodeWithRange;
		let parent = nodeGetters.parent(node);
		let containingRange = parent && scope.findRangeContainingStart(parent);
		
		if (!parent || containingRange !== range) {
			return scope.parent?.getInjectionParent(range);
		}
		
		return new NodeWithRange(containingRange, parent);
	}
	
	getHeadersOnLine(lineIndex) {
		let nodesWithLang = [...this.rootScope.generateNodesOnLineWithLang(lineIndex)];
		
		return nodesWithLang.map(function({node, lang}) {
			return {
				header: node,
				footer: lang.getFooter(node),
			};
		}).filter(r => r.footer);
	}
	
	getFootersOnLine(lineIndex) {
		let nodesWithLang = [...this.rootScope.generateNodesOnLineWithLang(lineIndex)];
		
		return nodesWithLang.map(function({node, lang}) {
			return {
				header: lang.getHeader(node),
				footer: node,
			};
		}).filter(r => r.header);
	}
	
	getContainingRange() {
		return new Range(0, this.string.length, s(c(0, 0), this.cursorAtEnd()));
	}
	
	indexFromCursor(cursor) {
		let {lineIndex, offset} = cursor;
		let index = 0;
		
		for (let i = 0; i < lineIndex; i++) {
			index += this.lines[i].string.length + this.fileDetails.newline.length;
		}
		
		index += offset;
		
		return index;
	}
	
	cursorFromIndex(index) {
		let lineIndex = 0;
		
		for (let line of this.lines) {
			if (index <= line.string.length) {
				return c(lineIndex, index);
			}
			
			lineIndex++;
			index -= line.string.length + this.fileDetails.newline.length;
		}
	}
	
	rangeFromCursor(cursor) {
		return this.rootScope.rangeFromCursor(cursor);
	}
	
	rangeFromCharCursor(cursor) {
		return this.rootScope.rangeFromCharCursor(cursor);
	}
	
	langFromCursor(cursor) {
		return this.rootScope.langFromCursor(cursor);
	}
	
	cursorAtEnd() {
		return c(this.lines.length - 1, this.lines[this.lines.length - 1].string.length);
	}
	
	selectAll() {
		return s(c(0, 0), this.cursorAtEnd());
	}
}
