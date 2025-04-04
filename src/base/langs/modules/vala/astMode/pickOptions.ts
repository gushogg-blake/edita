import AstSelection, {a} from "core/AstSelection";
import {isHeader, getHeaders} from "modules/astCommon/utils";

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
