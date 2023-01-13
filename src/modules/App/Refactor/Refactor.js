let Evented = require("utils/Evented");
let RefactorPreview = require("./RefactorPreview");

class Refactor extends Evented {
	constructor(app, options) {
		super();
		
		this.app = app;
		
		this.setOptions(options);
		
		this.editors = {
			find: this.createFindEditor(),
			replaceWith: this.createReplaceWithEditor(),
		};
		
		this.eachEditor(editor => editor.view.setWrap(true));
		
		this.preview = new RefactorPreview(app, this);
		this.previewTab = app.openRefactorPreviewTab(this.preview);
	}
	
	createFindEditor() {
		let editor = this.app.createEditor();
		
		editor.on("edit", this.onEditFind.bind(this));
		
		return editor;
	}
	
	createReplaceWithEditor() {
		let editor = this.app.createEditor();
		
		editor.on("edit", this.onEditReplaceWith.bind(this));
		
		return editor;
	}
	
	async updatePaths() {
		await this.preview.updatePaths();
	}
	
	onEditFind() {
		this.preview.updatePreview();
	}
	
	onEditReplaceWith() {
		this.preview.updatePreview();
	}
	
	setOptions(options) {
		this.options = options;
	}
	
	show() {
		this.eachEditor(editor => editor.view.show());
	}
	
	hide() {
		this.eachEditor(editor => editor.view.hide());
	}
	
	resize() {
		this.eachEditor(editor => editor.view.requestResizeAsync());
	}
	
	select() {
		this.app.selectTab(this.previewTab);
	}
	
	teardown() {
		this.app.closeTab(this.previewTab);
	}
	
	eachEditor(fn) {
		Object.values(this.editors).forEach(fn);
	}
}

module.exports = Refactor;
