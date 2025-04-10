import bluebird from "bluebird";
import {Evented} from "utils";
import {URL, Document} from "core";
import codePatterns from "modules/codePatterns";
import RefactorPreview from "./RefactorPreview";

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
		this.previewTab = app.mainTabs.openRefactorPreviewTab(this.preview);
	}
	
	async replaceAll() {
		await bluebird.map(this.getFiles(), async (file) => {
			let document = new Document(file);
			
			let find = this.editors.find.string;
			let replaceWith = this.editors.replaceWith.string;
			
			let results = this.find(document, find);
			
			if (results.length === 0) {
				return;
			}
			
			let replaced = codePatterns.replace(document.string, results, replaceWith);
			
			await file.write(replaced);
		});
	}
	
	createFindEditor() {
		let editor = this.app.createEditor();
		
		editor.on("edit", this.onEditFind.bind(this));
		
		//editor.document.setLang(base.langs.get("codepatterns"));
		
		return editor;
	}
	
	createReplaceWithEditor() {
		let editor = this.app.createEditor();
		
		editor.on("edit", this.onEditReplaceWith.bind(this));
		
		return editor;
	}
	
	async getFiles() {
		let nodes = (await bluebird.map(this.options.globs, glob => platform.fs().glob(glob))).flat();
		let textFileNodes = await bluebird.filter(nodes, node => node.isTextFile());
		let urls = textFileNodes.map(node => URL.file(node.path));
		
		return this.app.readFiles(urls);
	}
	
	async getPaths() {
		// MIGRATE
		return await bluebird.map(this.getFiles(), node => node.path);
	}
	
	async updatePaths() {
		await this.preview.updatePaths();
	}
	
	find(document, find) {
		try {
			return codePatterns.find(document, find);
		} catch (e) {
			if (e instanceof codePatterns.ParseError) {
				console.log("Error parsing codePattern");
				console.log(e);
				
				if (e.cause) {
					console.log(e.cause);
				}
				
				return [];
			} else {
				throw e;
			}
		}
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

export default Refactor;
