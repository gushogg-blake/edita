let {
	findNextLineIndexAtIndentLevel,
	findPrevLineIndexAtIndentLevel,
} = require("../../../common/codeIntel/utils");

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
		
		return [
			lineIndex,
			(footerIndex !== null ? footerIndex : lineIndex) + 1,
		];
	} else if (line.closers.length > 0) {
		let headerIndex = findPrevLineIndexAtIndentLevel(lines, lineIndex, line.indentLevel);
		
		return [
			headerIndex !== null ? headerIndex : lineIndex,
			lineIndex + 1,
		];
	} else if (line.trimmed.length > 0) {
		return [
			lineIndex,
			lineIndex + 1,
		];
	} else {
		if (forHilite) {
			return null;
		} else {
			return [
				lineIndex,
				lineIndex,
			];
		}
	}
}

module.exports = fromLineIndex;
