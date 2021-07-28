let api = {
	startOfLineContent(lines, lineIndex) {
		let line = lines[lineIndex];
		
		return [lineIndex, line.string.length - line.trimmed.length];
	},
	
	endOfLineContent(lines, lineIndex) {
		let line = lines[lineIndex];
		
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
