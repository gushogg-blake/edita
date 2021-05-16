let fromLineIndex = require("./fromLineIndex");

let api = {
	fromLineIndex,
	
	down(lines, selection) {
		return selection;
	},
}

module.exports = api;
