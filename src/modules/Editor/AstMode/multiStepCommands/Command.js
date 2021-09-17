let Evented = require("utils/Evented");

class Command extends Evented {
	constructor(astMode) {
		super();
		
		this.astMode = astMode;
		this.editor = astMode.editor;
		this.selectionOnReturnToAstMode = null;
		this.peekingAstMode = this.editor.modeSwitchKey.isPeeking;
		
		this.teardownCallbacks = [];
	}
	
	returnFromNormalMode() {
		let {editor} = this;
		
		editor.setAstSelection(this.selectionOnReturnToAstMode);
		editor.switchToAstMode();
		
		this.teardown();
		
		this.fire("complete");
	}
	
	cancel() {
		this.teardown();
		
		this.fire("canceled");
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

module.exports = Command;
