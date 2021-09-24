let next = require("./next");

module.exports = function*(node) {
	while (node) {
		yield node;
		
		node = next(node);
	}
}
