let URL = require("modules/URL");
let Tab = require("./Tab");

class ClippingsTab extends Tab {
	constructor(app, editor) {
		super(app, "clippings");
		
		this.editor = editor;
		
		this._url = new URL("special://clippings");
		
		this.view.setWrap(true);
	}
	
	get closeable() {
		return false;
	}
	
	get name() {
		return "Clippings";
	}
	
	get url() {
		return this._url;
	}
	
	get document() {
		return this.editor.document;
	}
	
	get view() {
		return this.editor.view;
	}
	
	focus() {
		this.view.requestFocus();
	}
	
	show() {
		this.view.show();
		this.resize();
	}
	
	hide() {
		this.view.hide();
	}
	
	resize() {
		this.view.requestResizeAsync();
	}
	
	addClipping(str) {
		let {editor, document} = this;
		let {newline} = document.fileDetails;
		
		editor.api.edit(document.cursorAtStart(), str + newline + newline);
	}
}

module.exports = ClippingsTab;
