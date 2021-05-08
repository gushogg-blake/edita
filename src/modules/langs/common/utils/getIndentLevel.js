module.exports = function(str, indentation) {
	return indentation.re.exec(str)[0].length / indentation.string.length;
}
