let api = {
	startOfLineContent(wrappedLines, lineIndex) {
		let {line} = wrappedLines[lineIndex];
		
		return [lineIndex, line.string.length - line.trimmed.length];
	},
	
	endOfLineContent(wrappedLines, lineIndex) {
		let {line} = wrappedLines[lineIndex];
		
		return [lineIndex, line.string.length];
	},
	
	equals(a, b) {
		let [aLineIndex, aOffset] = a;
		let [bLineIndex, bOffset] = b;
		
		return aLineIndex === bLineIndex && aOffset === bOffset;
	},
	
	isBefore(a, b) {
		let [aEndLineIndex, aEndOffset] = a;
		let [bStartLineIndex, bStartOffset] = b;
		
		return (
			aEndLineIndex < bStartLineIndex
			|| aEndLineIndex === bStartLineIndex && aEndOffset < bStartOffset
		);
	},
};

module.exports = api;
