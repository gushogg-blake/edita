function c(lineIndex, offset) {
	return {lineIndex, offset};
}

function isBefore(a, b) {
	return (
		a.lineIndex < b.lineIndex
		|| a.lineIndex === b.lineIndex && a.offset < b.offset
	);
}

let api = {
	c,
	isBefore,
	
	startOfLineContent(wrappedLines, lineIndex) {
		let {line} = wrappedLines[lineIndex];
		
		return c(lineIndex, line.indentOffset);
	},
	
	endOfLineContent(wrappedLines, lineIndex) {
		let {line} = wrappedLines[lineIndex];
		
		return c(lineIndex, line.string.length);
	},
	
	equals(a, b) {
		return a.lineIndex === b.lineIndex && a.offset === b.offset;
	},
	
	max(a, b) {
		return isBefore(a, b) ? b : a;
	},
	
	min(a, b) {
		return isBefore(a, b) ? a : b;
	},
};

module.exports = api;
