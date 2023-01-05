/*
replace everything outside the scope with spaces to use language servers
with embedded languages
*/

module.exports = function(scope) {
	let str = "";
	let {string} = scope;
	let prevRangeEnd = 0;
	
	for (let {startIndex, endIndex} of scope.ranges) {
		str += string.substring(prevRangeEnd, startIndex).replace(/./g, " ");
		str += string.substring(startIndex, endIndex);
		
		prevRangeEnd = endIndex;
	}
	
	str += string.substr(prevRangeEnd).replace(/./g, " ");
	
	return str;
}
