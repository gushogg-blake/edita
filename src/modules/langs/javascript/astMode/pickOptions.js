let AstSelection = require("modules/AstSelection");
let {isHeader, getHeaders} = require("modules/astCommon/utils");

let {s: a} = AstSelection;

module.exports = {
	contents: {
		type: "contents",
		label: "Contents",
		
		isAvailable(document, selection) {
			return isHeader(document, selection.startLineIndex);
		},
		
		getSelection(document, selection) {
			let [{header, footer}] = getHeaders(document, selection.startLineIndex);
			
			return a(header.start.lineIndex + 1, footer.start.lineIndex);
		},
	},
};
