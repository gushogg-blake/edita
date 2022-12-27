function c(lineIndex, offset) {
	return {lineIndex, offset};
}

function isBefore(a, b) {
	return (
		a.lineIndex < b.lineIndex
		|| a.lineIndex === b.lineIndex && a.offset < b.offset
	);
}

function equals(a, b) {
	return a.lineIndex === b.lineIndex && a.offset === b.offset;
}

let api = {
	c,
	isBefore,
	equals,
	
	startOfLineContent(wrappedLines, lineIndex) {
		let {line} = wrappedLines[lineIndex];
		
		return c(lineIndex, line.indentOffset);
	},
	
	endOfLineContent(wrappedLines, lineIndex) {
		let {line} = wrappedLines[lineIndex];
		
		return c(lineIndex, line.string.length);
	},
	
	max(a, b) {
		return isBefore(a, b) ? b : a;
	},
	
	min(a, b) {
		return isBefore(a, b) ? a : b;
	},
	
	start() {
		return c(0, 0);
	},
};

module.exports = api;
