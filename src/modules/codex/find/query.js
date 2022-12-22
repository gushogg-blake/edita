let middle = require("utils/middle");
let Cursor = require("modules/utils/Cursor");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");

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

module.exports = function(scope) {
	let {lang} = scope;
	let cache = {};
	
	return function(document, cursor, queryString) {
		queryString = addCaptureLabel(queryString);
		
		if (!cache[lang.code]) {
			cache[lang.code] = {};
		}
		
		if (!cache[lang.code][queryString]) {
			let query;
			
			try {
				query = lang.treeSitterLanguage.query(queryString);
				
				cache[lang.code][queryString] = scope.query(query);
			} catch (e) {
				/*
				tree-sitter is quite sensitive to the structure of the query -
				the node names have to be valid for the lang (so searching for
				(function) in html throws an error) and the structure has to be
				valid within the grammar, so you can't search for e.g.
				(import_statement (function)) and you also can't skip
				intermediate nesting levels and search for descendant nodes
				directly within the parent expression, you have to specify each
				step of the hierarchy.
				
				the nesting errors throw a TypeError whereas bad node names
				are a RangeError, so if node names were unique across langs it
				would probs be best to check the type and treat the nesting
				errors as parse errors (to give feedback on invalid queries),
				but if the same structure can be valid in one lang and invalid
				in another (due to shared node names but different grammars)
				then we need to be able to carry on with the query, in case
				one of the langs is nested in the other.
				
				a better solution might be to do the tree-sitter query creation
				in a separate step, trying it on each lang in the document and
				if it throws an error for all of them then it's invalid
				*/
				
				console.log(e);
				
				cache[lang.code][queryString] = [];
				
				return null;
			}
		}
		
		let queryResults = cache[lang.code][queryString];
		
		return findResultAtCursor(queryResults, cursor);
	}
}
