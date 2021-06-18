function s(startLineIndex, endLineIndex=startLineIndex) {
	return [
		startLineIndex,
		endLineIndex,
	];
}

let api = {
	s,
	
	equals(a, b) {
		let [aStart, aEnd] = a;
		let [bStart, bEnd] = b;
		
		return aStart === bStart && aEnd === bEnd;
	},
	
	isWithin(a, b) {
		let [aStart, aEnd] = a;
		let [bStart, bEnd] = b;
		
		return aStart >= bStart && aEnd <= bEnd;
	},
	
	lineIsWithinSelection(lineIndex, selection) {
		let [start, end] = selection;
		
		return lineIndex >= start && lineIndex < end;
	},
	
	insertionRange(lines, aboveLineIndex, belowLineIndex, offset) {
		if (aboveLineIndex === null) {
			return s(0);
		}
		
		if (belowLineIndex === null) {
			return s(aboveLineIndex + 1);
		}
		
		if (aboveLineIndex === belowLineIndex) {
			return s(offset < 0 ? aboveLineIndex : aboveLineIndex + 1);
		}
		
		let line = offset <= 0 ? lines[belowLineIndex] : lines[aboveLineIndex];
		let other = offset <= 0 ? lines[aboveLineIndex] : lines[belowLineIndex];
		let isInWhiteSpace = line.trimmed.length === 0;
		let otherIsWhiteSpace = other.trimmed.length === 0;
		
		console.log(isInWhiteSpace, otherIsWhiteSpace, offset);
		
		if (isInWhiteSpace && !otherIsWhiteSpace) {
			if (Math.abs(offset) > 0.8) {
				isInWhiteSpace = false;
			}
		}
		
		if (!isInWhiteSpace) {
			return s(aboveLineIndex + 1);
		}
		
		let start = aboveLineIndex + 1;
		let end = start;
		
		while (lines[start - 1] && lines[start - 1].trimmed.length === 0) {
			start--;
		}
		
		while (lines[end] && lines[end].trimmed.length === 0) {
			end++;
		}
		
		return s(start, end);
	},
};

module.exports = api;
