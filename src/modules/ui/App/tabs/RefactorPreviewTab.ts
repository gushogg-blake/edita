import {Special} from "modules/core/resources";
import Tab from "./Tab";

class RefactorPreviewTab extends Tab {
	constructor(app, refactorPreview) {
		super(app, Special.refactorPreview());
		
		this.refactorPreview = refactorPreview;
		
		this.teardownCallbacks = [
		];
	}
	
	async init() {
		
	}
	
	get name() {
		return "Refactor preview";
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
