let AstSelection = require("modules/utils/AstSelection");

let {
	findNextLineIndexAtIndentLevel,
	findPrevLineIndexAtIndentLevel,
} = require("./utils");

let {s} = AstSelection;

/*
if not a header/footer then just the line

if a header, then to the immediate footer

expanding goes to next indent level, NOT the entire ladder - there's a diff command
for that (like {} for next/prev paragraph in vim)

cutting selections where the header or footer is a header-footer (e.g. } else {)
- to be handled intelligently by the lang
*/

function fromLineIndex(lines, lineIndex, forHilite) {
	let line = lines[lineIndex];
	
	if (!forHilite) {
		while (line.trimmed.length === 0 && lineIndex > 0) {
			lineIndex--;
			line = lines[lineIndex];
		}
		
		while (line.trimmed.length === 0 && lineIndex < lines.length - 1) {
			lineIndex++;
			line = lines[lineIndex];
		}
	}
	
	if (line.openers.length > 0) {
		let footerIndex = findNextLineIndexAtIndentLevel(lines, lineIndex, line.indentLevel);
		
		return s(
			lineIndex,
			(footerIndex !== null ? footerIndex : lineIndex) + 1,
		);
	} else if (line.closers.length > 0) {
		let headerIndex = findPrevLineIndexAtIndentLevel(lines, lineIndex, line.indentLevel);
		
		return s(
			headerIndex !== null ? headerIndex : lineIndex,
			lineIndex + 1,
		);
	} else if (line.trimmed.length > 0) {
		return s(lineIndex, lineIndex + 1);
	} else {
		if (forHilite) {
			return null;
		} else {
			return s(lineIndex);
		}
	}
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
		let selection = selectionFromLineIndex(lines, i);
		
		if (selection.startLineIndex < startIndex) {
			break;
		}
		
		endIndex = Math.max(endIndex, selection.endLineIndex);
	}
	
	return s(startIndex, endIndex);
}

let api = {
	selectionFromLineIndex,
	hiliteFromLineIndex,
	fromLineRange,
	
	up(lines, selection) {
		let [startLineIndex] = selection;
		let line = lines[startLineIndex];
		let headerLineIndex = findPrevLineIndexAtIndentLevel(lines, startLineIndex, line.indentLevel - 1);
		
		if (headerLineIndex === null) {
			return selection;
		}
		
		return selectionFromLineIndex(lines, headerLineIndex);
	},
	
	down(lines, selection) {
		// if empty block, create a new blank line
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
