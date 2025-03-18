import {s, c} from "modules/Selection";

let langCodeMap = {
	"javascript": "typescript",
};

export function normaliseLangCode(langCode) {
	return langCodeMap[langCode] || langCode;
}

/*
replace everything outside the scope with spaces to use language servers
with embedded languages
*/

export function maskOtherRegions(scope) {
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

export function cursorToLspPosition({lineIndex, offset}) {
	return {line: lineIndex, character: offset};
}

export function lspPositionToCursor(position) {
	return c(position.line, position.character);
}

export function lspRangeToSelection(range) {
	let {start, end} = range;
	
	return s(lspPositionToCursor(start), lspPositionToCursor(end));
}
