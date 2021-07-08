let fromLineIndex = require("./fromLineIndex");
let fromLineRange = require("./fromLineRange");

let api = {
	selectionFromLineIndex(lines, lineIndex) {
		return fromLineIndex(lines, lineIndex, false);
	},
	
	hiliteFromLineIndex(lines, lineIndex) {
		return fromLineIndex(lines, lineIndex, true);
	},
	
	fromLineRange,
	
	up(lines, selection) {
		return selection;
	},
	
	down(lines, selection) {
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
