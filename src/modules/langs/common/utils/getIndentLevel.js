module.exports = function(str, indentation) {
	let indentStr = indentation.re.exec(str)[0];
	let level = indentStr.length / indentation.string.length;
	let offset = indentStr.length;
	
	return {
		level,
		offset,
	};
}
