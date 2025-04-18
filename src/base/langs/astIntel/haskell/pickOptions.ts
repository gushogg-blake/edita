import {AstSelection, a} from "core";
import {isHeader, getHeaders} from "modules/astIntel/utils";
import type {AstIntel} from "modules/astIntel";

export default function(astIntel: AstIntel) {
	return {
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
}
