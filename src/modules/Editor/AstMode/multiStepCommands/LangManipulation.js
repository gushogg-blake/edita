let AstSelection = require("modules/utils/AstSelection");
let parsePlaceholdersInLines = require("modules/utils/parsePlaceholdersInLines");
let Command = require("./Command");

let {s} = AstSelection;

class LangManipulation extends Command {
	constructor(astMode, code) {
		super(astMode);
		
		this.code = code;
	}
	
	start() {
		let {astMode, editor} = this;
		let {document, view, astSelection} = editor;
		let {startLineIndex, endLineIndex} = astSelection;
		
		let transformedLines = view.lang.astMode.astManipulations[this.code].apply(document, astSelection);
		
		let {
			replacedLines,
			placeholders,
		} = parsePlaceholdersInLines(transformedLines, startLineIndex);
		
		let edit = document.lineEdit(startLineIndex, endLineIndex - startLineIndex, replacedLines);
		let newSelection = s(startLineIndex, startLineIndex + replacedLines.length);
		let snippetSession = null;
		let normalSelection;
		
		if (placeholders.length > 0) {
			if (!this.peekingAstMode) {
				this.selectionOnReturnToAstMode = newSelection;
			}
			
			newSelection = undefined;
			normalSelection = placeholders[0].selection;
			
			editor.switchToNormalMode();
			
			if (placeholders.length > 1) {
				snippetSession = {
					index: 0,
					placeholders,
				};
			}
		}
		
		editor.applyAndAddHistoryEntry({
			edits: [edit],
			astSelection: newSelection,
			normalSelection,
			snippetSession,
		});
	}
}

module.exports = LangManipulation;
