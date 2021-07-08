let getOpenersAndClosersOnLine = require("../../common/codeIntel/getOpenersAndClosersOnLine");

let ctoo = {
	")": "(",
	"]": "[",
	"}": "{",
	"`": "`",
};

module.exports = function(line) {
	return getOpenersAndClosersOnLine(line, ctoo);
}
