let createPositions = require("./createPositions");

module.exports = function(lines, baseLineIndex=0) {
	let replacedLines = [];
	let positions = [];
	
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		
		let {
			replacedString,
			positions: linePositions,
		} = parsePositions(line, baseLineIndex + i);
		
		positions = [...positions, ...linePositions];
		
		replacedLines.push(replacedString);
	}
	
	return {
		replacedLines,
		positions,
	};
}
