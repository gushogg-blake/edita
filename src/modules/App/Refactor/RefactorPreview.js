let Evented = require("utils/Evented");

class RefactorPreview extends Evented {
	constructor(refactor) {
		super();
		
		this.refactor = refactor;
	}
	
	show() {
	}
	
	hide() {
	}
}

module.exports = RefactorPreview;
