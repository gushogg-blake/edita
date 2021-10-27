/*
replace everything outside the scope with spaces to use language servers
with embedded languages
*/

module.exports = function(document, scope) {
	let str = "";
	let code = document.string;
	let prevRangeEnd = 0;
	
	for (let {startIndex, endIndex} of scope.ranges) {
		str += code.substring(prevRangeEnd, startIndex).replace(/./g, " ");
		str += code.substring(startIndex, endIndex);
		
		prevRangeEnd = endIndex;
	}
	
	str += code.substr(prevRangeEnd).replace(/./g, " ");
	
	return str;
}
