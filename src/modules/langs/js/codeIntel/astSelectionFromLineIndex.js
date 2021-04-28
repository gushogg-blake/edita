let getOpenersAndClosersOnLine = require("../../common/codeIntel/getOpenersAndClosersOnLine");

/*
if not a header/footer then just the line

if a header, then to the immediate footer

expanding goes to next indent level, NOT the entire ladder - there's a diff command
for that (like {} for next/prev paragraph in vim)

cutting selection goes from first opener to that opener's closer in the footer,
if present (otherwise ?)

^ special cases for easy if statements/function headers?  ) { and ) => always indicate
function header (or if/while/for in the case of ) {).  } else is always an else or
else if statement

expand could go to ladder actually - seems poss more useful, and not unintuitive
*/

function astSelectionFromLineIndex(lines, lineIndex) {
	let line = lines[lineIndex];
	
	let {
		openers,
		closers,
	} = getOpenersAndClosersOnLine(line);
	
	if (openers.length > 0) {
		return [
			lineIndex,
			findFooterLineIndexFromHeader(lines, lineIndex, line),
		];
	} else if (closers.length > 0) {
		return [
			findHeaderLineIndexFromFooter(lines, lineIndex, line),
			lineIndex,
		];
	} else {
		return [
			lineIndex,
			lineIndex,
		];
	}
}

function findNextLineIndexAtIndentLevel(lines, lineIndex, indentLevel) {
	for (let i = lineIndex + 1; i < lines.length; i++) {
		if (lines[i].indentLevel === indentLevel) {
			return i;
		}
	}
	
	return null;
}

function findHeaderLineIndexFromFooter(lines, lineIndex, line) {
	let i = lineIndex - 1;
	let encounteredNonEmptyLine = false;
	
	while (true) {
		if (i < 0) {
			return null;
		}
		
		let line = lines[i];
		
		if (line.string.length > 0) {
			if (
				fromLine.trimmed[0] === "}"
				&& !encounteredNonEmptyLine
				&& line.indentLevel === fromLine.indentLevel
			) {
				return i;
			}
			
			encounteredNonEmptyLine = true;
			
			if (line.indentLevel === fromLine.indentLevel - 1) {
				if (isFooter(lines, i)) {
					return findHeaderLineIndex(lines, i - 1);
				} else {
					return i;
				}
			}
		}
		
		i--;
	}
}

/*
findFooterLineIndex - find the index of the line that's the footer to the current
line.

if the footer is also a header (e.g. } else {) then find the footer of that line,
and so on.
*/

function findFooterLineIndex(lines, lineIndex) {
	let fromLine = lines[lineIndex];
	let i = lineIndex + 1;
	let encounteredNonEmptyLine = false;
	
	while (true) {
		if (i === lines.length) {
			return null;
		}
		
		let line = lines[i];
		
		if (line.string.length > 0) {
			if (
				!encounteredNonEmptyLine
				&& line.trimmed[0] === "}"
				&& line.indentLevel === fromLine.indentLevel
			) {
				return i;
			}
			
			encounteredNonEmptyLine = true;
			
			if (line.indentLevel === fromLine.indentLevel - 1) {
				if (isHeader(lines, i)) {
					return findFooterLineIndex(lines, i + 1);
				} else {
					return i;
				}
			}
		}
		
		i++;
	}
}

/*
NOTE isHeader and isFooter can't be used for autoindent after typing e.g. opening
brace - they tell whether a line is a header/footer with existing inner lines
*/

function isHeader(lines, lineIndex) {
	let i = lineIndex + 1;
	
	while (true) {
		if (i === lines.length) {
			return false;
		}
		
		let line = lines[i];
		
		if (line.string.length > 0) {
			return line.indentLevel === lines[lineIndex].indentLevel + 1;
		}
		
		i++;
	}
}

function isFooter(lines, lineIndex) {
	let i = lineIndex - 1;
	
	while (true) {
		if (i < 0) {
			return false;
		}
		
		let line = lines[i];
		
		if (line.string.length > 0) {
			return line.indentLevel === lines[lineIndex].indentLevel + 1;
		}
		
		i--;
	}
}

function findNextNonEmptyLineIndex(lines, lineIndex, dir) {
	let i = lineIndex + dir;
	
	while (true) {
		if (i < 0 || i === lines.length) {
			return null;
		}
		
		let line = lines[i];
		
		if (line.string.trim().length > 0) {
			return i;
		}
		
		i += dir;
	}
}

/*
3 types of thing - headers, header-footers, and normal lines

(if there is nothing on the line, then we get a 0-length selection before/after that line
(after the prev element)
*/

module.exports = astSelectionFromLineIndex;
