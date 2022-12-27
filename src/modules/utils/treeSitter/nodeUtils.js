let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let treeSitterPointToCursor = require("./treeSitterPointToCursor");
let cachedNodeFunction = require("./cachedNodeFunction");
let nodeGetters = require("./nodeGetters");

let {s} = Selection;
let {c} = Cursor;

let api = {
	...nodeGetters,
	
	next: cachedNodeFunction(function(node) {
		let firstChild = api.firstChild(node);
		
		if (firstChild) {
			return firstChild;
		}
		
		let nextSibling = api.nextSibling(node);
		
		if (nextSibling) {
			return nextSibling;
		}
		
		while (node = api.parent(node)) {
			let nextSibling = api.nextSibling(node);
			
			if (nextSibling) {
				return nextSibling;
			}
		}
		
		return null;
	}),
	
	lineage: function(node) {
		let lineage = [node];
		let parent = api.parent(node);
		
		while (parent) {
			lineage.unshift(parent);
			
			parent = api.parent(parent);
		}
		
		return lineage;
	},
	
	selection(node) {
		let {startPosition, endPosition} = api.get(node, "startPosition", "endPosition");
		
		return s(c(startPosition.row, startPosition.column), c(endPosition.row, endPosition.column));
	},
	
	compareCharCursor(node, cursor) {
		let {lineIndex, offset} = cursor;
		let start = api.startPosition(node);
		let end = api.endPosition(node);
		
		if (lineIndex < start.row || lineIndex === start.row && offset < start.column) {
			return "cursorBeforeNode";
		}
		
		if (lineIndex > end.row || lineIndex === end.row && offset >= end.column) {
			return "cursorAfterNode";
		}
		
		return "nodeContainsCursor";
	},
	
	isAfter(node, cursor) {
		return api.compareCharCursor(node, cursor) === "cursorBeforeNode";
	},
	
	endsAfter(node, cursor) {
		let {row, column} = api.endPosition(node);
		
		return row > cursor.lineIndex || row === cursor.lineIndex && column > cursor.offset;
	},
	
	isOnOrAfter(node, cursor) {
		let {row, column} = api.startPosition(node);
		
		return row === cursor.lineIndex && column === cursor.offset || api.compareCharCursor(node, cursor) === "cursorBeforeNode";
	},
};

module.exports = api;
