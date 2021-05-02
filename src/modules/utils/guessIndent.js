let detectIndent = require("detect-indent");

module.exports = function(code) {
	return detectIndent(code).indent || null;
}
