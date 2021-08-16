let regexMatches = require("../../utils/regexMatches");

module.exports = function(code, word, index) {
	let re = new RegExp("\\b" + word + "\\w+", "g");
	let before = code.substr(0, index);
	let after = code.substr(index);
	
	let beforeInstances = regexMatches(before, re).reverse();
	let afterInstances = regexMatches(after, re);
	
	return [...beforeInstances, ...afterInstances].filter(function(word, i, all) {
		return all.indexOf(word) === i;
	});
}
