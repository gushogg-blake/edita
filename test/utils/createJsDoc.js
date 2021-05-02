let getFileDetails = require("../../src/modules/utils/getFileDetails");
let Document = require("../../src/modules/Document");

module.exports = function(code) {
	let prefs = {
		tabWidth: 4,
		defaultIndent: "\t",
	};
	
	let details = getFileDetails(prefs, code, "a.js");
	
	let doc = new Document(code, details);
	
	doc.parse();
	
	return doc;
}
