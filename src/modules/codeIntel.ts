import type {Document, Line, Cursor} from "core";

interface ICodeIntel {
	indentOnNewline?: (document: Document, line: Line, cursor: Cursor) => boolean;
	
	indentAdjustmentAfterInsertion?: Document, line: Line, cursor: Cursor) => number;
	
	isProjectRoot?: (dir: string): Promise<boolean>;
}

export default class CodeIntel implements ICodeIntel {
	langCode: string;
	
	constructor(langCode: string) {
		this.langCode = langCode;
	}
}
