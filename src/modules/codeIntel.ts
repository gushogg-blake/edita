import type {Document, Line, Cursor} from "core";

interface ICodeIntel {
	indentOnNewline?: (document: Document, line: Line, cursor: Cursor) => boolean;
	
	indentAdjustmentAfterInsertion?: (document: Document, line: Line, cursor: Cursor) => number;
	
	isProjectRoot?: (dir: string) => Promise<boolean>;
	
	// these return a single string of all affected lines, including indentation
	commentLines?: (document: Document, startLineIndex: number, endLineIndex: number) => string;
	uncommentLines?: (document: Document, startLineIndex: number, endLineIndex: number) => string;
	
	// https://stackoverflow.com/questions/46449237/type-x-has-no-properties-in-common-with-type-y
	_weakTypeFix: any;
}

export abstract class CodeIntel implements ICodeIntel {
	langCode: string;
	
	constructor(langCode: string) {
		this.langCode = langCode;
	}
	
	get lang() {
		return base.langs.get(this.langCode);
	}
	
	_weakTypeFix: any;
}
