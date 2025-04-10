export function indentLines(lines: string[], indentStr, amount=1) {
	return lines.map(line => indentStr.repeat(amount) + line);
}

export function getIndentLevel(str, indentation: IndentationDetails) {
	let indentStr = indentation.re.exec(str)[0];
	let level = indentStr.length / indentation.string.length;
	let cols = level * indentation.colsPerIndent;
	
	return {
		level,
		cols,
		offset: indentStr.length,
	};
}

// TODO this is more view-related
export function expandTabs(string, format: Format) {
	let {tabWidth} = base.prefs;
	
	let colsAdded = 0;
	
	return string.replaceAll("\t", function(_, index) {
		let size = tabWidth - (index + colsAdded) % tabWidth;
		
		colsAdded += size - 1;
		
		return " ".repeat(size);
	});
}
