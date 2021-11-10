let Evented = require("utils/Evented");
let bindFunctions = require("utils/bindFunctions");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let AstSelection = require("modules/utils/AstSelection");
let indentLines = require("modules/utils/indentLines");
let findIndentLevel = require("modules/langs/common/astMode/utils/findIndentLevel");
let multiStepCommands = require("./multiStepCommands");

let {s} = AstSelection;
let {c} = Cursor;

let commands = {
	wrap() {
		this.startMultiStepCommand(new multiStepCommands.Wrap(this));
	},
	
	unwrap() {
		let {editor} = this;
		
		let {
			document,
			astSelection,
		} = editor;
		
		
	},
};

class AstMode extends Evented {
	constructor(editor) {
		super();
		
		this.editor = editor;
		this.commands = bindFunctions(this, commands);
		this.clipboard = null;
		this.multiStepCommand = null;
	}
	
	doLangManipulation(code) {
		this.startMultiStepCommand(new multiStepCommands.LangManipulation(this, code));
	}
	
	startMultiStepCommand(command) {
		if (this.multiStepCommand) {
			this.multiStepCommand.cancel();
		}
		
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
	
	replaceSelectionWithBlankLine() {
		let {editor} = this;
		
		let {
			document,
			astSelection,
		} = editor;
		
		let {startLineIndex, endLineIndex} = astSelection;
		let headerLine = document.lines[startLineIndex];
		let remove = document.astEdit(astSelection, indentLines([""], document.fileDetails.indentation.string, headerLine.indentLevel));
		
		editor.applyAndAddHistoryEntry({
			edits: [remove],
			astSelection: s(startLineIndex, startLineIndex + 1),
		});
	}
	
	pasteFromNormalMode() {
		if (!this.clipboard) {
			return null;
		}
		
		let {editor} = this;
		let {document} = editor;
		
		let {start, end} = editor.view.Selection.sort();
		let {indentLevel} = document.lines[start.lineIndex];
		
		let astSelection = s(start.lineIndex, end.lineIndex + 1);
		
		let insertLines = AstSelection.selectionLinesToStrings(this.clipboard, document.fileDetails.indentation.string, indentLevel);
		
		let edit = document.astEdit(astSelection, insertLines);
		
		let edits = [edit];
		
		let {lineIndex, offset} = edit.newSelection.end;
		let cursor = c(lineIndex - 1, insertLines[insertLines.length - 1].length);
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
