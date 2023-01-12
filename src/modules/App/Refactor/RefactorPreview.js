let Evented = require("utils/Evented");

class RefactorPreview extends Evented {
	constructor(app, refactor) {
		super();
		
		this.app = app;
		this.refactor = refactor;
		
		this.editors = {
			results: this.createResultsEditor(),
			preview: app.createEditor(),
		};
	}
	
	createResultsEditor() {
		let editor = this.app.createEditor();
		
		//editor.on("normalSelectionChangedByMouseOrKeyboard", this.onNormalSelectionChanged.bind(this));
		
		return editor;
	}
	
	//getTooltipComponent(type) {
	//	let component = null;
	//	
	//	this.fire("requestTooltipComponent", type, c => component = c);
	//	
	//	return component;
	//}
	//
	//onNormalSelectionChanged() {
	//	let editor = this.editors.results;
	//	let selection = editor.normalSelection;
	//	
	//	if (selection.isFull()) {
	//		let component = this.getTooltipComponent("subtreeContents");
	//	} else {
	//		let component = this.getTooltipComponent("nodePath");
	//	}
	//}
	
	async setResultsCode() {
		let {path, code} = this.selectedFile;
		
		await this.setEditorCode(this.editors.results, new URL("refactor-results://" + path), code);
	}
	
	async updatePreview() {
		let editor = this.editors.preview;
		let {path, code} = this.selectedFile;
		
		let replaceWith = this.editors.replaceWith.string;
		let replaced = codex.replace(code, this.results, replaceWith);
		
		await this.setEditorCode(editor, new URL("refactor-preview://" + path), replaced);
	}
	
	async setEditorCode(editor, url, code) {
		let {document, view} = editor;
		
		let fileDetails = base.getFileDetails(code, url);
		
		await base.ensureRequiredLangsInitialised(fileDetails);
		
		view.startBatch();
		
		view.scrollTo(0, 0);
		
		editor.api.edit(document.selectAll(), code);
		
		document.url = url;
		
		document.setFileDetails(fileDetails);
		
		view.endBatch();
	}
	
	show() {
	}
	
	hide() {
	}
}

module.exports = RefactorPreview;
