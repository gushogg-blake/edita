import URL from "modules/core/resources/URL";
import Tab from "./Tab";

class RefactorPreviewTab extends Tab {
	constructor(app, refactorPreview) {
		super(app, "refactorPreview");
		
		this.refactorPreview = refactorPreview;
		this._url = new URL("special://refactor-preview");
		
		this.teardownCallbacks = [
		];
	}
	
	async init() {
		
	}
	
	get name() {
		return "Refactor preview";
	}
	
	get url() {
		return this._url;
	}
	
	get closeable() {
		return false;
	}
	
	focus() {
		
	}
	
	show() {
		this.refactorPreview.show();
	}
	
	hide() {
		this.refactorPreview.hide();
	}
	
	resize() {
		this.refactorPreview.resize();
	}
}

export default RefactorPreviewTab;
