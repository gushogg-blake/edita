let Document = require("../../src/modules/Document");

module.exports = function(code) {
	let details = app.getFileDetails(code, "a.js");
	
	let doc = new Document(code, details);
	
	return doc;
}
