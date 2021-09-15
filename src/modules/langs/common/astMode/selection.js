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

function fromLineIndex(document, lineIndex, forHilite) {
	let {lines} = document;
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
	
	let openers = document.getOpenersOnLine(lineIndex);
	let closers = document.getClosersOnLine(lineIndex);
	
	if (openers.length > 0) {
		let footerIndex = findNextLineIndexAtIndentLevel(document, lineIndex, line.indentLevel);
		
		return s(
			lineIndex,
			(footerIndex !== null ? footerIndex : lineIndex) + 1,
		);
	} else if (closers.length > 0) {
		let headerIndex = findPrevLineIndexAtIndentLevel(document, lineIndex, line.indentLevel);
		
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

function selectionFromLineIndex(document, lineIndex) {
	return fromLineIndex(document, lineIndex, false);
}

function hiliteFromLineIndex(document, lineIndex) {
	return fromLineIndex(document, lineIndex, true);
}

/*
trim any blank lines from the ends of the range, then go through the range
extending the bottom of the selection by the selection at each index, but
break before a selection would extend the top (e.g. at a footer)

- ranges that include the top part of a block will extend to include the whole
  block

- ranges that include the footer of a block will stop inside the block
*/

function fromLineRange(document, startLineIndex, endLineIndex) {
	let {lines} = document;
	
	if (startLineIndex === endLineIndex - 1) {
		return selectionFromLineIndex(document, startLineIndex);
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
		let selection = selectionFromLineIndex(document, i);
		
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
	
	up(document, selection) {
		let {lines} = document;
		let {startLineIndex} = selection;
		let line = lines[startLineIndex];
		let headerLineIndex = findPrevLineIndexAtIndentLevel(document, startLineIndex, line.indentLevel - 1);
		
		if (headerLineIndex === null) {
			return selection;
		}
		
		return selectionFromLineIndex(document, headerLineIndex);
	},
	
	down(document, selection) {
		// if empty block, create a new blank line
		return selection;
	},
	
	next(document, selection) {
		return selection;
	},
	
	previous(document, selection) {
		return selection;
	},
}

module.exports = api;
