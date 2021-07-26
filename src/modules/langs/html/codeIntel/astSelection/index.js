let {
	findNextLineIndexAtIndentLevel,
	findPrevLineIndexAtIndentLevel,
} = require("../../../common/codeIntel/utils");

let selectionFromLineIndex = require("./selectionFromLineIndex");
let hiliteFromLineIndex = require("./hiliteFromLineIndex");
let fromLineRange = require("./fromLineRange");

let api = {
	selectionFromLineIndex(lines, lineIndex) {
		return selectionFromLineIndex(lines, lineIndex);
	},
	
	hiliteFromLineIndex(lines, lineIndex) {
		return hiliteFromLineIndex(lines, lineIndex);
	},
	
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
