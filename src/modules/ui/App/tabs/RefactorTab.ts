import {Special} from "modules/core/resources";
import Tab from "./Tab";

class RefactorTab extends Tab {
	constructor(app, refactor) {
		super(app, Special.refactor());
		
		this.refactor = refactor;
		
		this.teardownCallbacks = [
		];
	}
	
	async init() {
		
	}
	
	get name() {
		return "Refactor";
	}
	
	focus() {
		
	}
	
	show() {
		this.refactor.show();
	}
	
	hide() {
		this.refactor.hide();
	}
	
	resize() {
		this.refactor.resize();
	}
	
	select() {
		this.refactor.select();
	}
	
	teardown() {
		super.teardown();
		
		this.refactor.teardown();
	}
}

export default RefactorTab;
