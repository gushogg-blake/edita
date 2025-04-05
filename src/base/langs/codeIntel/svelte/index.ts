import {CodeIntel} from "modules/codeIntel";

export default class extends CodeIntel {
	indentOnNewline(line, lines, lineIndex) {
		
	}
	
	indentAdjustmentAfterInsertion(document, line, cursor) {
		return 0;
	}
};
