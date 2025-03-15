let AstSelection = require("modules/AstSelection");
let {isHeader, getHeaders} = require("modules/astCommon/utils");

let {s: a} = AstSelection;

export default {
	contents: {
		type: "contents",
		label: "Contents",
		
		isAvailable(document, lineIndex) {
			return isHeader(document, lineIndex);
		},
		
		getSelection(document, lineIndex) {
			let [{header, footer}] = getHeaders(document, lineIndex);
			
			return a(header.start.lineIndex + 1, footer.start.lineIndex);
		},
	},
};
