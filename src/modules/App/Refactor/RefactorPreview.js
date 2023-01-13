let bluebird = require("bluebird");
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
		let nodes = (await bluebird.map(this.options.globs, glob => platform.fs().glob(glob))).flat();
		
		nodes = await bluebird.filter(nodes, node => node.isFile());
		
		let paths = nodes.map(node => node.path);
		
		this.paths = paths;
		
		this.fire("updatePaths");
		
		await this.selectPath("/home/gus/projects/edita-main/src/modules/langs/javascript/index.js");
	}
	
	async selectPath(path) {
		let code = await platform.fs(path).read();
		
		this.selectedFile = {path, code};
		
		await this.setResultsCode();
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
	
	hiliteMatches() {
		this.editors.results.api.setNormalHilites(this.results.map(result => result.replaceSelection));
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
	
	find(string) {
		try {
			this.results = codex.find(this.editors.results.document, string);
			
			this.hiliteMatches();
			this.updatePreview();
		} catch (e) {
			if (e instanceof codex.ParseError) {
				console.log("Error parsing codex");
				console.log(e);
				
				if (e.cause) {
					console.log(e.cause);
				}
			} else {
				throw e;
			}
		}
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
