let Document = require("modules/Document");
let URL = require("modules/URL");
let dedent = require("test/utils/dedent");

module.exports = function(code) {
	return new Document(dedent(code), new URL("new:///a.js"));
}
