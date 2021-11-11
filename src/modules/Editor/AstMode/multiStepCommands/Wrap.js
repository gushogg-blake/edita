let AstSelection = require("modules/utils/AstSelection");
let Command = require("./Command");

let {s} = AstSelection;

class Wrap extends Command {
	constructor(editor) {
		super(editor);
		
		this.teardownCallbacks = [
			editor.astMode.on("pasteFromNormalMode", this.onPasteFromNormalMode.bind(this)),
		];
	}
	
	start() {
		let {astMode, editor} = this;
		
		astMode.setClipboard();
		astMode.replaceSelectionWithBlankLine();
		
		editor.switchToNormalMode();
	}
	
	onPasteFromNormalMode(paste) {
		let {astSelection, insertLines, edit} = paste;
		let {startLineIndex} = astSelection;
		
		if (!this.peekingAstMode) {
			this.selectionOnReturnToAstMode = s(startLineIndex, startLineIndex + insertLines.length);
		}
	}
}

module.exports = Wrap;
