module.exports = function(n, indentLevel, indentStr) {
	let spaces = [];
	
	for (let i = 0; i < n; i++) {
		spaces.push(indentStr.repeat(indentLevel));
	}
	
	return spaces;
}
