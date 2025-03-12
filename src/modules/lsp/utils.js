let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");

let {s} = Selection;
let {c} = Cursor;

let langCodeMap = {
	"javascript": "typescript",
};

function normaliseLangCode(langCode) {
	return langCodeMap[langCode] || langCode;
}

/*
replace everything outside the scope with spaces to use language servers
with embedded languages
*/

function maskOtherRegions(scope) {
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

function cursorToLspPosition({lineIndex, offset}) {
	return {line: lineIndex, character: offset};
}

function lspPositionToCursor(position) {
	return c(position.line, position.character);
}

function lspRangeToSelection(range) {
	let {start, end} = range;
	
	return s(lspPositionToCursor(start), lspPositionToCursor(end));
}

module.exports = {
	normaliseLangCode,
	maskOtherRegions,
	lspPositionToCursor,
	lspRangeToSelection,
	cursorToLspPosition,
};
