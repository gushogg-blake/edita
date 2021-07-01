let selectionFromLineIndex = require("./selectionFromLineIndex");

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
	
	console.log(startLineIndex, endLineIndex);
	
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

module.exports = fromLineRange;
	//
	//let indentLevel = Math.max(...lines.slice(startLineIndex, endLineIndex).map(line => line.indentLevel));
	//
	//console.log(indentLevel);
	//