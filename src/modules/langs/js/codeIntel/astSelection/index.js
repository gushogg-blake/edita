let fromLineIndex = require("./fromLineIndex");

let api = {
	fromLineIndex,
	
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
