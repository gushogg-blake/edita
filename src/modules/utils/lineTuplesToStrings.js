module.exports = function(lineTuples, indentStr, baseIndentLevel=0, noHeaderIndent=false) {
	return lineTuples.map(function([indentLevel, line], i) {
		if (noHeaderIndent && i === 0) {
			return line;
		} else {
			return indentStr.repeat(baseIndentLevel + indentLevel) + line;
		}
	});
}
