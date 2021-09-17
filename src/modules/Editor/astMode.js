let AstSelection = require("modules/utils/AstSelection");
let indentLines = require("modules/utils/indentLines");
let findIndentLevel = require("modules/langs/common/astMode/utils/findIndentLevel");

let {s} = AstSelection;

module.exports = {
	wrap() {
		if (!this.modeSwitchKey.isPeeking) {
			this.astSelectionAfterSnippet = s(0, 0);
		}
		
		this.astMode.setClipboard();
		this.astMode.replaceSelectionWithBlankLine();
		this.switchToNormalMode();
	},
	
	getClipboard() {
		return this.astClipboard;
	},
	
	setClipboard() {
		this.astClipboard = this.document.getAstSelection(this.astSelection);
	},
	
	replaceSelectionWithBlankLine() {
		let {
			document,
			astSelection,
		} = this;
		
		let {startLineIndex, endLineIndex} = astSelection;
		let headerLine = document.lines[startLineIndex];
		let remove = document.astEdit(astSelection, indentLines([""], document.fileDetails.indentation.string, headerLine.indentLevel));
		
		this.applyAndAddHistoryEntry({
			edits: [remove],
			astSelection: s(startLineIndex, startLineIndex + 1),
		});
	},
	
	pasteFromNormalMode() {
		let {document} = this;
		
		let {start, end} = this.view.Selection.sorted();
		let {indentLevel} = document.lines[start.lineIndex];
		
		let astSelection = s(start.lineIndex, end.lineIndex + 1);
		
		let insertLines = AstSelection.selectionLinesToStrings(this.astMode.getClipboard(), document.fileDetails.indentation.string, indentLevel);
		
		let edit = document.astEdit(astSelection, insertLines);
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
		});
	},
};
