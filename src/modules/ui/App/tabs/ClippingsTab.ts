import Selection, {s} from "modules/core/Selection";
import URL from "modules/core/resources/URL";
import Tab from "./Tab";

class ClippingsTab extends Tab {
	constructor(app) {
		super(app, "clippings");
		
		this.editor = app.createEditor();
		
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
		let {newline} = document.format;
		
		editor.api.edit(Selection.start(), str + newline + newline);
	}
	
	setLang(lang) {
		this.editor.setLang(lang);
	}
}

export default ClippingsTab;
