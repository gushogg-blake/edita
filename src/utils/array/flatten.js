let _typeof = require("@wildwood/utils/typeof");

function reduce(acc, val) {
	if (_typeof(val) === "Array") {
		return [...acc, ...flatten(val)];
	} else {
		return [...acc, val];
	}
}

function flatten(array) {
	return array.reduce(reduce, []);
}

module.exports = flatten;
