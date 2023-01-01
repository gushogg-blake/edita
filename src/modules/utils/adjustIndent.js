module.exports = function(lineTuples, adjustment) {
	return lineTuples.map(function([indentLevel, string]) {
		return [Math.max(0, indentLevel + adjustment), string];
	});
}
