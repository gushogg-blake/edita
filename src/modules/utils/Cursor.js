let api = {
	startOfLineContent(lines, lineIndex) {
		let line = lines[lineIndex];
		
		return [lineIndex, line.indentOffset];
	},
	
	endOfLineContent(lines, lineIndex) {
		let line = lines[lineIndex];
		
		return [lineIndex, line.string.length];
	},
};

module.exports = api;
