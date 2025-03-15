let _typeof = require("utils/typeof");

module.exports = function(patterns, str) {
	return patterns.some(function(pattern) {
		if (str === pattern) {
			return true;
		} else if (_typeof(pattern) === "RegExp") {
			return pattern.test(str);
		} else if (_typeof(pattern) === "Function") {
			return pattern(str);
		}
	});
}
