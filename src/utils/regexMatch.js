module.exports = function(string, re) {
	let match = string.match(re);
	
	return match ? match[0] : "";
}
