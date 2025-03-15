let checkNewlines = require("modules/utils/checkNewlines");

module.exports = function(str) {
	let {
		mostCommon,
		mixed,
	} = checkNewlines(str);
	
	if (mixed) {
		throw new Error("String has mixed newlines");
	}
	
	return mostCommon;
}
