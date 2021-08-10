function c(lineIndex, offset) {
	return {lineIndex, offset};
}

let api = {
	c,
	
	startOfLineContent(wrappedLines, lineIndex) {
		let {line} = wrappedLines[lineIndex];
		
		return c(lineIndex, line.string.length - line.trimmed.length);
	},
	
	endOfLineContent(wrappedLines, lineIndex) {
		let {line} = wrappedLines[lineIndex];
		
		return c(lineIndex, line.string.length);
	},
	
	equals(a, b) {
		return a.lineIndex === b.lineIndex && a.offset === b.offset;
	},
	
	isBefore(a, b) {
		return (
			a.lineIndex < b.lineIndex
			|| a.lineIndex === b.lineIndex && a.offset < b.offset
		);
	},
};

module.exports = api;
