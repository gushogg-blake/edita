import Evented from "utils/Evented";
import {sortedPartition} from "utils/array";
import {FileLikeURL} from "core";
import codePatterns from "modules/codePatterns";

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
		// MIGRATE
		let code = await this.app.readFile(FileLikeURL.file(path));
		
		if (code === null) {
			return;
		}
		
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
		
		this.fire("requestTooltipComponent", {
			type,
			
			provideComponent(c) {
				component = c;
			},
		});
		
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
		
		await this.setEditorCode(
			this.editors.results,
			await Memory.withPath(path, code),
		);
		
		let results = this.refactor.find(this.editors.results.document, find);
		
		let replaced = codePatterns.replace(code, results, replaceWith);
		
		await this.setEditorCode(
			this.editors.preview,
			await Memory.withPath(path, replaced),
		);
		
		this.hiliteMatches(results);
	}
	
	hiliteMatches(results) {
		this.editors.results.api.setNormalHilites(results.map(result => result.replaceSelection));
	}
	
	async setEditorCode(editor, url, code) {
		let {document, view} = editor;
		
		let format = base.getFormat(code, url);
		
		await base.ensureRequiredLangsInitialised(format.lang);
		
		//view.scrollTo(0, 0);
		
		editor.api.edit(document.selectAll(), code);
		
		await document.setUrl(url);
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

export default RefactorPreview;
