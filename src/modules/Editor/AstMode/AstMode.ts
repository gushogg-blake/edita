let Evented = require("utils/Evented");
let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");
let AstSelection = require("modules/AstSelection");
let MultiStepCommand = require("./MultiStepCommand");

let {s} = AstSelection;
let {c} = Cursor;

class AstMode extends Evented {
	constructor(editor) {
		super();
		
		this.editor = editor;
		this.clipboard = null;
		this.command = null;
	}
	
	doAstManipulation(astManipulation) {
		if (this.multiStepCommand) {
			this.multiStepCommand.cancel();
		}
		
		let command = new MultiStepCommand(this.editor, astManipulation);
		
		this.multiStepCommand = command;
		
		command.onNext("complete canceled", () => {
			this.multiStepCommand = null;
		});
		
		command.start();
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
		
		let astSelection = s(left.lineIndex, right.lineIndex + 1);
		
		let insertLines = AstSelection.selectionLinesToStrings(this.clipboard, document.format.indentation.string, indentLevel);
		
		let edit = document.astEdit(astSelection, insertLines);
		
		let edits = [edit];
		
		let {lineIndex, offset} = edit.newSelection.end;
		let cursor = c(lineIndex - 1, insertLines.at(-1).length);
		let newSelection = Selection.s(cursor);
		
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
		
		this.fire("pasteFromNormalMode", paste);
		
		return paste;
	}
}

module.exports = AstMode;
