module.exports = function(lineTuples, indentStr, baseIndentLevel=0, noHeaderIndent=false) {
	return lineTuples.map(function([indentLevel, string], i) {
		if (noHeaderIndent && i === 0) {
			return string;
		} else {
			return indentStr.repeat(baseIndentLevel + indentLevel) + string;
		}
	});
}
