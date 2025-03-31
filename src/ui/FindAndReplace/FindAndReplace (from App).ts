import {Evented} from "utils";

export default class extends Evented<{}> {
	
	// commenting to avoid TS errors
	//show(options) {
	//	// TODO use last single-line selection, so we can select a word,
	//	// then make a selection to find in selection and find will
	//	// default to the word
	//	
	//	let search = "";
	//	let {selectedTab} = this.app.mainTabs;
	//	
	//	if (selectedTab?.isEditor) {
	//		let {editor} = selectedTab;
	//		let {document} = editor;
	//		let selectedText = editor.getSelectedText();
	//		
	//		if (selectedText.indexOf(document.format.newline) === -1) {
	//			search = selectedText;
	//		}
	//	}
	//	
	//	this.tools.findAndReplace({
	//		...this.findAndReplace.defaultOptions,
	//		...this.findAndReplace.savedOptions,
	//		search,
	//		...options,
	//	});
	//}
	//
	//hide() {
	//	this.fire("hide");
	//	
	//	// MIGRATE listen to hide in app?
	//	this.app.mainTabs.focusSelectedTab();
	//}
	
}
