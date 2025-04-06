import {AstSelection, a, Selection, s, Cursor, c} from "core";
import type {Document, Lang} from "core";
import {isHeader, getHeaders} from "modules/astIntel/utils";

import {AstSelection, a, Selection, s, Cursor, c} from "core";
import type {Document, Lang} from "core";

export default function(lang: Lang) {
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
