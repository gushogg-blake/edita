let Cursor = require("modules/Cursor");

let {c} = Cursor;

module.exports = function(point) {
	return c(point.row, point.column);
}
