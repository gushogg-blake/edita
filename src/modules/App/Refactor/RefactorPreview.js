let Evented = require("utils/Evented");
let sortedPartition = require("utils/array/sortedPartition");
let URL = require("modules/URL");
let cdoePattern = require("modules/cdoePattern");

class RefactorPreview extends Evented {
	constructor(app, refactor) {
		super();
		
		this.app = app;
		this.refactor = refactor;
		
		this.editors = {
			results: this.createResultsEditor(),
			preview: app.createEditor(),
		};
		
		this.paths = [];
		this.selectedFile = null;
		
		this.updatePaths();
	}
	
	get options() {
		return this.refactor.options;
	}
	
	hiliteMatches() {
		this.editors.results.api.setNormalHilites(this.results.map(result => result.replaceSelection));
	}
	
	async updatePaths() {
		this.paths = await this.refactor.getPaths();
		
		this.fire("updatePaths");
		
		if (this.paths.length > 0) {
			await this.selectPath(this.paths[0]);
		}
	}
	
	async selectPath(path) {
		let code = await platform.fs(path).read();
		
		this.selectedFile = {path, code};
		
		this.fire("selectPath");
		
		await this.updatePreview();
	}
	
	createResultsEditor() {
		let editor = this.app.createEditor();
		
		editor.on("normalSelectionChangedByMouseOrKeyboard", this.onNormalSelectionChanged.bind(this));
		
		return editor;
	}
	
	getTooltipComponent(type) {
		let component = null;
		
		this.fire("requestTooltipComponent", type, c => component = c);
		
		return component;
	}
	
	onNormalSelectionChanged() {
		let editor = this.editors.results;
		let cursor = editor.normalSelection.left;
		let node = editor.document.getNodeAtCursor(cursor);
		let lineage = node.lineage().slice(1);
		
		let [notOnLine, onLine] = sortedPartition(lineage, n => n.start.lineIndex !== cursor.lineIndex);
		
		this.fire("showAstHint", {
			all: lineage,
			notOnLine,
			onLine,
		});
	}
	
	async updatePreview() {
		let find = this.refactor.editors.find.string;
		let replaceWith = this.refactor.editors.replaceWith.string;
		
		let {path, code} = this.selectedFile;
		
		await this.setEditorCode(this.editors.results, new URL("refactor-results://" + path), code);
		
		let results = this.refactor.find(this.editors.results.document, find);
		
		let replaced = cdoePattern.replace(code, results, replaceWith);
		
		await this.setEditorCode(this.editors.preview, new URL("refactor-preview://" + path), replaced);
		
		this.hiliteMatches(results);
	}
	
	hiliteMatches(results) {
		this.editors.results.api.setNormalHilites(results.map(result => result.replaceSelection));
	}
	
	async setEditorCode(editor, url, code) {
		let {document, view} = editor;
		
		let fileDetails = base.getFileDetails(code, url);
		
		await base.ensureRequiredLangsInitialised(fileDetails);
		
		view.startBatch();
		
		//view.scrollTo(0, 0);
		
		editor.api.edit(document.selectAll(), code);
		
		document.url = url;
		
		document.setFileDetails(fileDetails);
		
		view.endBatch();
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
	
	eachEditor(fn) {
		Object.values(this.editors).forEach(fn);
	}
}

module.exports = RefactorPreview;
