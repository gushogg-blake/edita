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
			findNextLineIndexAtIndentLevel(lines, lineIndex, line.indentLevel),
		];
	} else if (closers.length > 0) {
		return [
			findPrevLineIndexAtIndentLevel(lines, lineIndex, line.indentLevel),
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

function findPrevLineIndexAtIndentLevel(lines, lineIndex, indentLevel) {
	for (let i = lineIndex - 1; i >= 0; i--) {
		if (lines[i].indentLevel === indentLevel) {
			return i;
		}
	}
	
	return null;
}

module.exports = astSelectionFromLineIndex;
