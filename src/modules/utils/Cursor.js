let api = {
	startOfLineContent(lines, lineIndex) {
		let line = lines[lineIndex];
		
		return [lineIndex, line.indentOffset];
	},
};

module.exports = api;
