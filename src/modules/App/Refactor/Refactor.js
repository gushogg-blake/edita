let Evented = require("utils/Evented");
let parseMatch = require("modules/refactor/parseMatch");

class Refactor extends Evented {
	constructor(app, options) {
		super();
		
		this.setOptions(options);
		
		this.editors = {
			matchPreview: app.createEditor(),
			resultPreview: app.createEditor(),
		};
	}
	
	setOptions(options) {
		this.options = options;
	}
	
	show() {
		Object.values(this.editors).forEach(editor => editor.view.show());
	}
	
	hide() {
		Object.values(this.editors).forEach(editor => editor.view.hide());
	}
}

module.exports = Refactor;
