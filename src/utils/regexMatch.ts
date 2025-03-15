module.exports = function(string, re) {
	return string.match(re)?.[0] || "";
}
