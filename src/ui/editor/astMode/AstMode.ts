import {Evented} from "utils";
import {Selection, s, Cursor, c, AstSelection, a} from "core";
import type {AstManipulation, AstSelectionContents} from "core";

import {
	astManipulations as commonAstManipulations,
	astManipulationIsAvailable,
} from "modules/astIntel";

import type {Editor} from "ui/editor";
import MultiStepCommand from "./MultiStepCommand";

export default class AstMode extends Evented<{
	pasteFromNormalMode: any; // TYPE
}> {
	editor: Editor;
	clipboard: AstSelectionContents | null = null;
	multiStepCommand: MultiStepCommand | null = null;
	
	constructor(editor: Editor) {
		super();
		
		this.editor = editor;
	}
	
	getAvailableAstManipulations(): AstManipulation[] {
		let {document, view, astSelection} = this.editor;
		
		let astManipulations: Record<string, AstManipulation> = {
			...commonAstManipulations,
			...view.lang.astMode?.astManipulations,
		};
		
		return Object.values(astManipulations).filter((manipulation) => {
			return astManipulationIsAvailable(manipulation, document, astSelection);
		});
	}
	
	private _doAstManipulation(astManipulation: AstManipulation): void {
		if (this.multiStepCommand) {
			this.multiStepCommand.cancel();
		}
		
		let command = new MultiStepCommand(this.editor, astManipulation);
		
		this.multiStepCommand = command;
		
		command.onNext("resolved", () => {
			this.multiStepCommand = null;
		});
		
		command.start();
	}
	
	private findAstManipulation(code: string): AstManipulation | null {
		let {document, view, astSelection} = this.editor;
		
		let astManipulations: Record<string, AstManipulation> = {
			...commonAstManipulations,
			...view.lang.astMode?.astManipulations,
		};
		
		if (code[0] === "$") {
			return Object.values(astManipulations).reverse().find((m) => {
				return m.group === code && astManipulationIsAvailable(m, document, astSelection);
			}) || null;
		} else {
			let manipulation = astManipulations[code] || null;
			
			if (!manipulation || !astManipulationIsAvailable(manipulation, document, astSelection)) {
				return null;
			}
			
			return manipulation;
		}
	}
	
	doAstManipulation(code: string): void {
		let manipulation = this.findAstManipulation(code);
		
		if (!manipulation) {
			return;
		}
		
		this._doAstManipulation(manipulation);
	}
	
	clearMultiStepCommand() {
		if (this.multiStepCommand) {
			this.multiStepCommand.cancel();
		}
	}
	
	get multiStepCommandWaitingForReturnToAstMode() {
		return this.multiStepCommand && this.multiStepCommand.selectionOnReturnToAstMode;
	}
	
	multiStepCommandReturnToAstMode() {
		this.multiStepCommand.returnFromNormalMode();
	}
	
	setClipboard() {
		this.clipboard = this.editor.document.getAstSelection(this.editor.astSelection);
	}
	
	pasteFromNormalMode() {
		if (!this.clipboard) {
			return null;
		}
		
		let {editor} = this;
		let {document} = editor;
		
		let {left, right} = editor.view.normalSelection;
		let {indentLevel} = document.lines[left.lineIndex];
		
		let astSelection = a(left.lineIndex, right.lineIndex + 1);
		
		let insertLines = AstSelection.selectionContentsToStrings(this.clipboard, document.format.indentation.string, indentLevel);
		
		let edit = document.astEdit(astSelection, insertLines);
		
		let edits = [edit];
		
		let {lineIndex, offset} = edit.newSelection.end;
		let cursor = c(lineIndex - 1, insertLines.at(-1).length);
		let newSelection = s(cursor);
		
		editor.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: editor.adjustSnippetSession(edits),
		});
		
		let paste = {
			astSelection,
			insertLines,
			edit,
		};
		
		this.multiStepCommand?.onPasteFromNormalMode(paste);
		
		return paste;
	}
}
