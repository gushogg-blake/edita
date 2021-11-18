let AstSelection = require("modules/utils/AstSelection");

let {
	//findNextLineIndexAtIndentLevel,
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
	
	let headers = document.getHeadersOnLine(lineIndex);
	let footers = document.getFootersOnLine(lineIndex);
	
	if (headers.length > 0) {
		let footerIndex = headers[0].footer.endPosition.row;
		
		return s(lineIndex, footerIndex + 1);
	} else if (footers.length > 0) {
		let headerIndex = footers[0].header.startPosition.row;
		
		return s(headerIndex, lineIndex + 1);
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

function hiliteFromLineIndex(document, lineIndex, pickOptionType=null) {
	let selection = fromLineIndex(document, lineIndex, true);
	
	if (pickOptionType) {
		let {astMode} = document.langFromAstSelection(selection);
		
		return astMode.pickOptions[pickOptionType].getSelection(document, selection);
	} else {
		return selection;
	}
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
	
	let i = startLineIndex;
	
	while (i <= endLineIndex - 1) {
		let selection = selectionFromLineIndex(document, i);
		
		if (selection.startLineIndex < startIndex) {
			break;
		}
		
		endIndex = Math.max(endIndex, selection.endLineIndex);
		i = Math.max(i + 1, endIndex);
	}
	
	return s(startIndex, endIndex);
}

let api = {
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
		let {startLineIndex} = selection;
		
		for (let {lang, node} of document.generateNodesOnLineWithLang(startLineIndex)) {
			let footer = lang.getFooter(node);
			
			if (footer) {
				let header = node;
				
				if (footer.startPosition.row > header.endPosition.row + 1) {
					for (let i = header.endPosition.row + 1; i < footer.startPosition.row ; i++) {
						if (document.lines[i].trimmed.length > 0) {
							return fromLineIndex(document, i, false);
						}
					}
					
					return fromLineRange(document, header.endPosition.row + 1, footer.startPosition.row);
				}
				
				return selection;
			}
		}
		
		// TODO fall back to indentation based
		
		return selection;
	},
	
	next(document, selection) {
		return selection;
	},
	
	previous(document, selection) {
		return selection;
	},
	
	containsNonBlankLines(document, selection) {
		return document.getSelectedLines(selection).some(line => line.trimmed.length > 0);
	},
	
	trim(document, selection) {
		// only trim selections that have at least one non-blank line
		
		if (!AstSelection.isFull(selection)) {
			return selection;
		}
		
		if (!api.containsNonBlankLines(document, selection)) {
			return selection;
		}
		
		let {lines} = document;
		let {startLineIndex, endLineIndex} = selection;
		
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
		
		return s(startLineIndex, endLineIndex);
	},
}

module.exports = api;
