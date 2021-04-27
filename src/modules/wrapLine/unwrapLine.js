module.exports = function(line) {
	line.height = 1;
	
	delete line.wrappedLines;
	delete line.wrapIndentCols;
}
