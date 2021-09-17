let AstSelection = require("modules/utils/AstSelection");
let Command = require("./Command");

let {s} = AstSelection;

class Wrap extends Command {
	constructor(astMode) {
		super(astMode);
		
		this.teardownCallbacks = [
			astMode.on("pasteFromNormalMode", this.onPasteFromNormalMode.bind(this)),
		];
	}
	
	onPasteFromNormalMode(paste) {
		let {astSelection, insertLines, edit} = paste;
		let {startLineIndex} = astSelection;
		
		if (!this.peekingAstMode) {
			this.selectionOnReturnToAstMode = s(startLineIndex, startLineIndex + insertLines.length);
		}
	}
	
	start() {
		let {astMode, editor} = this;
		
		astMode.setClipboard();
		astMode.replaceSelectionWithBlankLine();
		
		editor.switchToNormalMode();
	}
}

module.exports = Wrap;
