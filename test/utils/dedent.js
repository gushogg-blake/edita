/*
dedent template strings
*/

module.exports = function(str) {
	str = str.substr(1, str.length - 1);
	
	let minIndent = str.split("\n").reduce(function(min, line) {
		return Math.min(min, line.match(/^\t*/)[0].length);
	}, Infinity) + 1;
	
	let re = new RegExp("^\t{" + minIndent + "}", "gm");
	
	str = str.replace(re, "");
	
	// final indent (up to closing `) is one less so doesn't match above
	str = str.replace(/\n\s+$/, "\n");
	
	return str;
}
