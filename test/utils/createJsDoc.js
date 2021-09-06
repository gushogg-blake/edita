let Document = require("modules/Document");

module.exports = function(code) {
	let path = "a.js";
	
	let doc = new Document(code, path);
	
	return doc;
}
