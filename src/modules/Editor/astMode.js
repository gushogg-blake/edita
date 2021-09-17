let AstSelection = require("modules/utils/AstSelection");
let indentLines = require("modules/utils/indentLines");

let {s: a} = AstSelection;

module.exports = {
	wrap() {
		let {
			document,
			astSelection,
		} = this;
		
		let {startLineIndex, endLineIndex} = astSelection;
		let headerLine = document.lines[astSelection.startLineIndex];
		let remove = document.astEdit(astSelection, indentLines([""], document.fileDetails.indentation.string, headerLine.indentLevel));
		
		this.applyAndAddHistoryEntry({
			edits: [remove],
			astSelection: a(startLineIndex, startLineIndex + 1),
		});
		
		this.switchToNormalMode();
	},
};
