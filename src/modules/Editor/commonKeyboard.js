let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

module.exports = {
	toggleComment(comment) {
		let {document} = this;
		let {start, end} = this.view.Selection.sort();
		
		let [startLineIndex, endLineIndex] = (
			this.mode === "normal"
			? [start.lineIndex, end.lineIndex + 1]
			: [this.astSelection.startLineIndex, this.astSelection.endLineIndex]
		);
		
		let selection = s(c(startLineIndex, 0), c(endLineIndex - 1, Infinity));
		let langCursor = c(startLineIndex, document.lines[startLineIndex].indentOffset);
		let method = comment ? "commentLines" : "uncommentLines";
		let lang = document.langFromCursor(langCursor);
		
		if (!lang[method]) {
			return;
		}
		
		let replaceWith = lang[method](document, startLineIndex, endLineIndex);
		
		let edits = [document.edit(selection, replaceWith)];
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: selection,
			snippetSession: this.adjustSnippetSession(edits),
		});
	},
	
	comment() {
		this.commonKeyboard.toggleComment(true);
	},
	
	uncomment() {
		this.commonKeyboard.toggleComment(false);
	},
	
	undo() {
		this.undo();
	},
	
	redo() {
		this.redo();
	},
	
	toggleWrap() {
		this.view.setWrap(!this.view.wrap);
		
		return ["noScrollCursorIntoView"];
	},
};
