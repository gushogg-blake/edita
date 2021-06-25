module.exports = function(str, indentation, tabWidth) {
	let indentStr = indentation.re.exec(str)[0];
	let level = indentStr.length / indentation.string.length;
	let offset = level * indentation.colsPerIndent;
	
	return {
		level,
		offset,
	};
}
