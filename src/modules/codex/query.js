let cache = new WeakMap();

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
	
	console.log(queryResults);
}

module.exports = query;
