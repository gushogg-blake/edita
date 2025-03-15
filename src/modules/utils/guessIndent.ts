let detectIndent = require("detect-indent");

export default function(code) {
	return detectIndent(code).indent || null;
}
