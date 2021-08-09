let Document = require("../../src/modules/Document");

module.exports = function(code) {
	let path = "a.js";
	
	let fileDetails = base.getFileDetails(code, path);
	
	let doc = new Document(code, path, fileDetails);
	
	return doc;
}
