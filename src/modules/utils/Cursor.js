let api = {
	startOfLineContent(lines, lineIndex) {
		let line = lines[lineIndex];
		
		return [lineIndex, line.string.length - line.trimmed.length];
	},
	
	endOfLineContent(lines, lineIndex) {
		let line = lines[lineIndex];
		
		return [lineIndex, line.string.length];
	},
};

module.exports = api;
