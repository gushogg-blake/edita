let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let nodeGetters = require("./nodeGetters");

let {s} = Selection;
let {c} = Cursor;

module.exports = function(node) {
	let {startPosition, endPosition} = nodeGetters.get(node, "startPosition", "endPosition");
	
	return s(c(startPosition.row, startPosition.column), c(endPosition.row, endPosition.column));
}
