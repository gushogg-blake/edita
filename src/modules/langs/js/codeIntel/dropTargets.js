let indentLines = require("../../../utils/indentLines");

let handleDrop = {
	addSelectionToNewElse(
		document,
		fromSelection,
		toSelection,
		lines,
		option,
	) {
		
	},
};

module.exports = {
	addSelectionToNewElse: {
		type: "addSelectionToNewElse",
		label: "+ else",
		
		handleDrop(
			document,
			fromSelection,
			toSelection,
			lines,
			option,
		) {
			let indentStr = document.fileDetails.indentation.string;
			let selectionHeight = lines.length;
			let [toStart, toEnd] = toSelection;
			let footerLineIndex = toEnd - 1;
			let footerLine = document.lines[footerLineIndex];
			
			document.edit(footerLineIndex, 1, indentLines([
				"} else {",
				...indentLines(lines.map(function([indentLevel, line]) {
					return indentStr.repeat(indentLevel) + line;
				}), indentStr),
				"}",
			], indentStr, footerLine.indentLevel).join(document.fileDetails.newline));
		},
	},
	
	addSelectionToNewElseIf: {
		type: "addSelectionToNewElseIf",
		label: "+ else if",
	},
};
