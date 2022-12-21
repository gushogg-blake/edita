let middle = require("utils/middle");
let Cursor = require("modules/utils/Cursor");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
let ParseError = require("./ParseError");

function findResultAtCursor(cache, cursor) {
	let startIndex = 0;
	let endIndex = cache.length;
	
	while (endIndex - startIndex > 0) {
		let index = middle(startIndex, endIndex);
		let result = cache[index];
		let mainNode = result.captures[0].node;
		let startCursor = treeSitterPointToCursor(mainNode.startPosition);
		
		if (Cursor.equals(cursor, startCursor)) {
			let captures = {};
			
			for (let {name, node} of result.captures) {
				captures[name] = node;
			}
			
			return {
				node: mainNode,
				captures,
			};
		} else if (Cursor.isBefore(cursor, startCursor)) {
			endIndex = index;
		} else {
			startIndex = index + 1;
		}
	}
	
	return null;
}

/*
if no explicit capture label is given for the top-level node,
use the node name
*/

function addCaptureLabel(queryString) {
	if (!queryString.match(/@([\w_]+)$/)) {
		let [, nodeName] = queryString.match(/^\(([\w_]+)/);
		
		queryString += " @" + nodeName;
	}
	
	return queryString;
}

module.exports = function() {
	let cache = {};
	
	return function(document, cursor, queryString) {
		queryString = addCaptureLabel(queryString);
		
		let range = document.rangeFromCursor(cursor);
		let {scope, lang} = range;
		
		if (!cache[lang.code]) {
			cache[lang.code] = {};
		}
		
		if (!cache[lang.code][queryString]) {
			let query;
			
			try {
				query = lang.treeSitterLanguage.query(queryString);
			} catch (e) {
				throw new ParseError("Query parse error", {
					cause: e,
				});
			}
			
			cache[lang.code][queryString] = scope.query(query);
		}
		
		let queryResults = cache[lang.code][queryString];
		
		return findResultAtCursor(queryResults, cursor);
	}
}
