let regexMatches = require("utils/regexMatches");
let unique = require("utils/array/unique");

module.exports = function(code, word, index, extraWords=[]) {
	let re = new RegExp("\\b" + word + "\\w+", "g");
	let before = code.substr(0, index);
	let after = code.substr(index);
	
	let beforeInstances = regexMatches(before, re).reverse();
	let extraInstances = regexMatches(extraWords.join(","), re);
	let afterInstances = regexMatches(after, re);
	
	return unique([...beforeInstances, ...extraInstances, ...afterInstances]);
}
