let fromLineRange = require("./fromLineRange");
let selectionFromLineIndex = require("./selectionFromLineIndex");
let hiliteFromLineIndex = require("./hiliteFromLineIndex");

let api = {
	selectionFromLineIndex(lines, lineIndex) {
		return selectionFromLineIndex(lines, lineIndex);
	},
	
	hiliteFromLineIndex(lines, lineIndex) {
		return hiliteFromLineIndex(lines, lineIndex);
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
