module.exports = function(str, newline) {
	str = str.replaceAll("\r\n", newline)
	str = str.replaceAll("\r", newline);
	str = str.replaceAll("\n", newline);
	
	return str;
}
