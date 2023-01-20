let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let URL = require("modules/URL");
let Document = require("modules/Document");
let cdoePattern = require("modules/cdoePattern");
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
	
	async replaceAll() {
		await bluebird.map(this.getFiles(), async (file) => {
			let code = await file.read();
			let document = await this.getDocument(code, file.path);
			
			let find = this.editors.find.string;
			let replaceWith = this.editors.replaceWith.string;
			
			let results = this.find(document, find);
			
			if (results.length === 0) {
				return;
			}
			
			let replaced = cdoePattern.replace(code, results, replaceWith);
			
			await file.write(replaced);
		});
	}
	
	async getDocument(code, path) {
		let url = URL.file(path);
		
		let fileDetails = base.getFileDetails(code, url);
		
		await base.ensureRequiredLangsInitialised(fileDetails);
		
		return new Document(code, url, {
			fileDetails,
		});
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
	
	async getFiles() {
		let nodes = (await bluebird.map(this.options.globs, glob => platform.fs().glob(glob))).flat();
		
		return await bluebird.filter(nodes, node => node.isTextFile());
	}
	
	async getPaths() {
		return await bluebird.map(this.getFiles(), node => node.path);
	}
	
	async updatePaths() {
		await this.preview.updatePaths();
	}
	
	find(document, find) {
		try {
			return cdoePattern.find(document, find);
		} catch (e) {
			if (e instanceof cdoePattern.ParseError) {
				console.log("Error parsing cdoePattern");
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

module.exports = Refactor;
