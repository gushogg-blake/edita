module.exports = function(lines, indentStr, amount=1) {
	return lines.map(line => indentStr.repeat(amount) + line);
}
