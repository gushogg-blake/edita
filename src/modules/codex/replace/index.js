let stringToLineTuples = require("modules/utils/stringToLineTuples");

function getLineTuplesWithPlaceholders(str) {
	let lineTuples = stringToLineTuples(str);
}

module.exports = function(code, results, replaceWith) {
	let replaceWithLineTuplesWithPlaceholders = getLineTuplesWithPlaceholders(replaceWith);
	
	return code;
}
