let Document = require("modules/Document");
let dedent = require("test/utils/dedent");

module.exports = function(code) {
	return new Document(dedent(code), "new:///a.js");
}
