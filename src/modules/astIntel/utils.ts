export function getFooterLineIndex(document, lineIndex) {
	for (let node of document.generateNodesStartingOnLine(lineIndex)) {
		let footer = node.lang.astIntel?.getFooter(node);
		
		if (footer) {
			return footer.end.lineIndex;
		}
	}
	
	return null;
}

export function getHeaderLineIndex(document, lineIndex) {
	for (let node of document.generateNodesStartingOnLine(lineIndex)) {
		let header = node.lang.astIntel?.getHeader(node);
		
		if (header) {
			return header.start.lineIndex;
		}
	}
	
	return null;
}

export function isHeader(document, lineIndex) {
	return getFooterLineIndex(document, lineIndex) !== null;
}

export function isFooter(document, lineIndex) {
	return getHeaderLineIndex(document, lineIndex) !== null;
}

export function getHeaders(document, lineIndex) {
	let nodes = [...document.generateNodesStartingOnLine(lineIndex)];
	
	return nodes.map(function(node) {
		return {
			header: node,
			footer: node.lang.astIntel?.getFooter(node),
		};
	}).filter(r => r.footer);
}

export function getFooters(document, lineIndex) {
	let nodes = [...document.generateNodesStartingOnLine(lineIndex)];
	
	return nodes.map(function(node) {
		return {
			header: node.lang.astIntel?.getHeader(node),
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

export function extendDown(document, lineIndex, followHeaderFooters=true) {
	let footerLineIndex = getFooterLineIndex(document, lineIndex);
	
	if (footerLineIndex !== null) {
		return followHeaderFooters ? extendDown(document, footerLineIndex, true) : footerLineIndex + 1;
	} else {
		return lineIndex + 1;
	}
}

export function extendUp(document, lineIndex, followHeaderFooters=true) {
	let headerLineIndex = getHeaderLineIndex(document, lineIndex);
	
	if (headerLineIndex !== null) {
		return followHeaderFooters ? extendUp(document, headerLineIndex, true) : headerLineIndex;
	} else {
		return lineIndex;
	}
}

export function countSpace(document, lineIndex, dir) {
	let {lines} = document;
	let space = 0;
	let line;
	
	while (line = lines[lineIndex]) {
		if (line.isBlank) {
			space++;
		} else {
			break;
		}
		
		lineIndex += dir;
	}
	
	return space;
}

export function createSpaces(n, indentLevel, indentStr) {
	let spaces = [];
	
	for (let i = 0; i < n; i++) {
		spaces.push(indentStr.repeat(indentLevel));
	}
	
	return spaces;
}

export function findIndentLevel(document, lineIndex) {
	let {lines} = document;
	let prev = 0;
	let next = 0;
	let prevLineIndex = lineIndex - 1;
	let nextLineIndex = lineIndex;
	
	while (prevLineIndex >= 0) {
		if (lines[prevLineIndex].trimmed.length > 0) {
			prev = lines[prevLineIndex].indentLevel;
			
			if (isHeader(document, prevLineIndex)) {
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
}

export function findSiblingIndex(document, lineIndex, indentLevel, dir) {
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
}

export function findNextLineIndexAtIndentLevel(document, lineIndex, indentLevel) {
	let {lines} = document;
	
	for (let i = lineIndex + 1; i < lines.length; i++) {
		if (lines[i].indentLevel === indentLevel) {
			return i;
		}
	}
	
	return null;
}

export function findPrevLineIndexAtIndentLevel(document, lineIndex, indentLevel) {
	let {lines} = document;
	
	for (let i = lineIndex - 1; i >= 0; i--) {
		if (lines[i].indentLevel === indentLevel) {
			return i;
		}
	}
	
	return null;
}
