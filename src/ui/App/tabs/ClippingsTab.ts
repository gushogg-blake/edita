import {Selection, s} from "core";
import {Special} from "core/resource";
import type App from "ui/App";
import type {Editor} from "ui/editor";
import Tab from "./Tab";

class ClippingsTab extends Tab {
	editor: Editor;
	
	constructor(app: App) {
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
		this.document.resource.setLang(lang);
	}
}

export default ClippingsTab;
