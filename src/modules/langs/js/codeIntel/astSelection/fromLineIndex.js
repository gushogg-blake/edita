let getOpenersAndClosersOnLine = require("../getOpenersAndClosersOnLine");

let {
	findNextLineIndexAtIndentLevel,
	findPrevLineIndexAtIndentLevel,
} = require("../../../common/codeIntel/utils");

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

function fromLineIndex(lines, lineIndex) {
	let line = lines[lineIndex];
	
	let {
		openers,
		closers,
	} = getOpenersAndClosersOnLine(line);
	
	if (openers.length > 0) {
		let footerIndex = findNextLineIndexAtIndentLevel(lines, lineIndex, line.indentLevel);
		
		return [
			lineIndex,
			(footerIndex !== null ? footerIndex : lineIndex) + 1,
		];
	} else if (closers.length > 0) {
		let headerIndex = findPrevLineIndexAtIndentLevel(lines, lineIndex, line.indentLevel);
		
		return [
			headerIndex !== null ? headerIndex : lineIndex,
			lineIndex + 1,
		];
	} else {
		return [
			lineIndex,
			lineIndex + 1,
		];
	}
}

module.exports = fromLineIndex;
