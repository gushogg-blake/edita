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
	
	/*
	insertion range - given line indexes above and below the mouse, and the
	mouse's distance from the middle of the line it's on, calculate where the
	selection should be dropped.
	
	- if the mouse is between two non-blank lines, the selection should be
	  dropped between the lines, and no new whitespace should be created
	
	- if the mouse is between a non-blank line and a blank line, and is not
	  "fully" on the blank line (determined by a threshold), the selection
	  should be dropped between the two lines (same as above)
	
	- if the mouse is fully on a blank line, the selection should be dropped
	  within the blank space, and more whitespace should be created so that
	  there is a space equal to the original amount of whitespace either side
	  of the dropped selection
	*/
	
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
		
		/*
		if we're only just on the blank next to a non-blank line,
		allow a buffer to make it easier to place things next to blank
		lines
		*/
		
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
