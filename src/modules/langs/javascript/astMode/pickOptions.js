let AstSelection = require("modules/utils/AstSelection");

let {s: a} = AstSelection;

module.exports = {
	contents: {
		type: "contents",
		label: "Contents",
		
		isAvailable(document, selection) {
			return document.getHeadersOnLine(selection.startLineIndex).length > 0;
		},
		
		getSelection(document, selection) {
			let [{header, footer}] = document.getHeadersOnLine(selection.startLineIndex);
			
			return a(header.startPosition.row + 1, footer.startPosition.row);
		},
	},
};
