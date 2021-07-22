let Document = require("../../src/modules/Document");

module.exports = function(code) {
	let details = app.getFileDetails(code, "a.html");
	
	let doc = new Document(code, details);
	
	return doc;
}
