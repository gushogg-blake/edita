import Selection, {s} from "modules/core/Selection";
import {Special} from "modules/core/resources";
import Tab from "./Tab";

class ClippingsTab extends Tab {
	constructor(app) {
		super(app, Special.clippings());
		
		this.editor = app.createEditor();
		
		this.view.setWrap(true);
	}
	
	get closeable() {
		return false;
	}
	
	get name() {
		return "Clippings";
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
		let {newline} = document.format;
		
		editor.api.edit(Selection.start(), str + newline + newline);
	}
	
	setLang(lang) {
		// MIGRATE
		this.editor.setLang(lang);
	}
}

export default ClippingsTab;
