let Document = require("modules/Document");
let createPositions = require("modules/snippets/createPositions");

module.exports = function(code, results, replaceWith) {
	let document = new Document(code);
	
	for (let result of results) {
		document.apply(document.edit(result.selection, replaceWith));
	}
	
	return document.string;
}
