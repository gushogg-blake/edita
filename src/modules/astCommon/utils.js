let nodeGetters = require("modules/utils/treeSitter/nodeGetters");

function getFooterLineIndex(document, lineIndex) {
	for (let {node, lang} of document.generateNodesOnLineWithLang(lineIndex)) {
		let footer = lang.getFooter(node);
		
		if (footer) {
			return nodeGetters.startPosition(node).row;
		}
	}
	
	return null;
}

function isHeader(document, lineIndex) {
	return getFooterLineIndex(document, lineIndex) !== null;
}

function getHeaders(document, lineIndex) {
	let nodesWithLang = [...document.generateNodesOnLineWithLang(lineIndex)];
	
	return nodesWithLang.map(function({node, lang}) {
		return {
			header: node,
			footer: lang.getFooter(node),
		};
	}).filter(r => r.footer);
}

function getFooters(document, lineIndex) {
	let nodesWithLang = [...document.generateNodesOnLineWithLang(lineIndex)];
	
	return nodesWithLang.map(function({node, lang}) {
		return {
			header: lang.getHeader(node),
			footer: node,
		};
	}).filter(r => r.header);
}

/*
if the line is a header, extend the selection to the footer. if the
footer is also a header and followHeaderFooters is true, keep
extending to that header's footer and so on (to get e.g. a full if-
else ladder).
*/

function extend(document, lineIndex, followHeaderFooters=true) {
	let footerLineIndex = getFooterLineIndex(document, lineIndex);
	
	if (footerLineIndex) {
		return followHeaderFooters ? extend(footerLineIndex) : footerLineIndex + 1;
	} else {
		return lineIndex + 1;
	}
}

let api = {
	isHeader,
	getFooterLineIndex,
	getHeaders,
	getFooters,
	extend,
	
	countSpace(document, lineIndex, dir) {
		let {lines} = document;
		let space = 0;
		let line;
		
		while (line = lines[lineIndex]) {
			if (line.trimmed.length === 0) {
				space++;
			} else {
				break;
			}
			
			lineIndex += dir;
		}
		
		return space;
	},
	
	createSpaces(n, indentLevel, indentStr) {
		let spaces = [];
		
		for (let i = 0; i < n; i++) {
			spaces.push(indentStr.repeat(indentLevel));
		}
		
		return spaces;
	},
	
	findIndentLevel(document, lineIndex) {
		let {lines} = document;
		let prev = 0;
		let next = 0;
		let prevLineIndex = lineIndex - 1;
		let nextLineIndex = lineIndex;
		
		while (prevLineIndex >= 0) {
			if (lines[prevLineIndex].trimmed.length > 0) {
				prev = lines[prevLineIndex].indentLevel;
				
				if (document.getHeadersOnLine(prevLineIndex).length > 0) {
					prev++;
				}
				
				break;
			}
			
			prevLineIndex--;
		}
		
		while (nextLineIndex < lines.length) {
			if (lines[nextLineIndex].trimmed.length > 0) {
				next = lines[nextLineIndex].indentLevel;
				
				break;
			}
			
			nextLineIndex++;
		}
		
		return Math.max(next, prev);
	},
	
	findSiblingIndex(document, lineIndex, indentLevel, dir) {
		let {lines} = document;
		let line;
		
		while (line = lines[lineIndex]) {
			if (line.indentLevel < indentLevel) {
				return null;
			}
			
			if (line.indentLevel === indentLevel && line.trimmed.length > 0) {
				return lineIndex;
			}
			
			lineIndex += dir;
		}
		
		return null;
	},
	
	findNextLineIndexAtIndentLevel(document, lineIndex, indentLevel) {
		let {lines} = document;
		
		for (let i = lineIndex + 1; i < lines.length; i++) {
			if (lines[i].indentLevel === indentLevel) {
				return i;
			}
		}
		
		return null;
	},
	
	findPrevLineIndexAtIndentLevel(document, lineIndex, indentLevel) {
		let {lines} = document;
		
		for (let i = lineIndex - 1; i >= 0; i--) {
			if (lines[i].indentLevel === indentLevel) {
				return i;
			}
		}
		
		return null;
	},
};

module.exports = api;
