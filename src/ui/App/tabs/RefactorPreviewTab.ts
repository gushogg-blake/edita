import {Special} from "core/resource";
import type App from "ui/App";
import type {RefactorPreview} from "ui/Refactor";
import Tab from "./Tab";

class RefactorPreviewTab extends Tab {
	refactorPreview: RefactorPreview;
	
	constructor(app: App, refactorPreview: RefactorPreview) {
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
