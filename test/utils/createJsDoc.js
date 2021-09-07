let Document = require("modules/Document");

module.exports = function(code) {
	return new Document(code, "a.js");
}
