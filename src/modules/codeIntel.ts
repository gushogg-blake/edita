import type {Document, Line, Cursor} from "core";

export interface CodeIntel {
	indentOnNewline?: (document: Document, line: Line, cursor: Cursor) => boolean;
	
	indentAdjustmentAfterInsertion?: Document, line: Line, cursor: Cursor) => number;
	
	isProjectRoot?: (dir: string): Promise<boolean>;
}
