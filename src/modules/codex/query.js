let middle = require("utils/middle");
let Cursor = require("modules/utils/Cursor");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");

let cache = new WeakMap();

function findResultAtCursor(results, cursor) {
	let startIndex = 0;
	let endIndex = results.length;
	
	while (endIndex - startIndex > 0) {
		let index = middle(startIndex, endIndex);
		let result = results[index];
		let mainNode = result.captures[0].node;
		let startCursor = treeSitterPointToCursor(mainNode.startPosition);
		
		if (Cursor.equals(cursor, startCursor)) {
			let captures = {};
			
			for (let {name, node} of result.captures) {
				captures[name] = node;
			}
			
			return captures;
		} else if (Cursor.isBefore(cursor, startCursor)) {
			endIndex = index;
		} else {
			startIndex = index + 1;
		}
	}
	
	return null;
}

function query(document, cursor, queryString) {
	if (!cache.has(document)) {
		cache.set(document, {});
	}
	
	let results = cache.get(document);
	let range = document.rangeFromCursor(cursor);
	let {scope, lang} = range;
	
	if (!results[lang.code]) {
		results[lang.code] = {};
	}
	
	if (!results[lang.code][queryString]) {
		let query = lang.treeSitterLanguage.query(queryString);
		
		results[lang.code][queryString] = scope.query(query);
	}
	
	let queryResults = results[lang.code][queryString];
	
	return findResultAtCursor(queryResults, cursor);
}

module.exports = query;
