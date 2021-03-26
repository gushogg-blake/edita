let indentRe = /^\s+/gm;

module.exports = function(str) {
	return str.trim().replace(indentRe, "");
}
