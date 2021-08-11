function fromLineIndex(lines, lineIndex, forHilite) {
	return [
		lineIndex,
		lineIndex,
	];
}

function selectionFromLineIndex(lines, lineIndex) {
	return fromLineIndex(lines, lineIndex, false);
}

function hiliteFromLineIndex(lines, lineIndex) {
	return fromLineIndex(lines, lineIndex, true);
}

/*
trim any blank lines from the ends of the range, then go through the range
extending the bottom of the selection by the selection at each index, but
break before a selection would extend the top (e.g. at a footer)

- ranges that include the top part of a block will extend to include the whole
  block

- ranges that include the footer of a block will stop inside the block
*/

function fromLineRange(lines, startLineIndex, endLineIndex) {
	if (startLineIndex === endLineIndex - 1) {
		return selectionFromLineIndex(lines, startLineIndex);
	}
	
	let startLine = lines[startLineIndex];
	let endLine = lines[endLineIndex - 1];
	
	while (startLine.trimmed.length === 0 && startLineIndex < endLineIndex - 1) {
		startLineIndex++;
		startLine = lines[startLineIndex];
	}
	
	while (endLine?.trimmed.length === 0 && endLineIndex > startLineIndex) {
		endLineIndex--;
		endLine = lines[endLineIndex - 1];
	}
	
	let startIndex = startLineIndex;
	let endIndex = startIndex;
	
	for (let i = startLineIndex; i <= endLineIndex - 1; i++) {
		let [s, e] = selectionFromLineIndex(lines, i);
		
		if (s < startIndex) {
			break;
		}
		
		endIndex = Math.max(endIndex, e);
	}
	
	return [
		startIndex,
		endIndex,
	];
}

let api = {
	selectionFromLineIndex,
	hiliteFromLineIndex,
	fromLineRange,
	
	up(lines, selection) {
		return selection;
	},
	
	down(lines, selection) {
		return selection;
	},
	
	next(lines, selection) {
		return selection;
	},
	
	previous(lines, selection) {
		return selection;
	},
}

module.exports = api;
