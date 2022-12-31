let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let sync = require("utils/sync");
let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");
let URL = require("modules/URL");
let codex = require("modules/codex");

let {s} = Selection;
let {c} = Cursor;

let dedent = require("test/utils/dedent");

class Refactor extends Evented {
	constructor(app, options) {
		super();
		
		this.sync = sync();
		
		this.app = app;
		
		this.setOptions(options);
		
		this.editors = {
			find: this.createFindEditor(),
			replaceWith: this.createReplaceWithEditor(),
			results: app.createEditor(),
			preview: app.createEditor(),
		};
		
		let {find, replaceWith} = this.editors;
		
		for (let editor of [find, replaceWith]) {
			editor.view.setWrap(true);
		}
		
		this.paths = [];
		
		this.selectedFile = null;
		
		this.updatePaths();
	}
	
	createFindEditor() {
		let editor = app.createEditor();
		
		editor.api.edit(Selection.start(), dedent(`
			let lang = (object (method_definition (property_identifier) @p) @-init (#eq? @p "init")) @obj;
			
			module.exports = lang;
		`));
		
		editor.on("edit", this.onEditFind.bind(this));
		
		return editor;
	}
	
	createReplaceWithEditor() {
		let editor = app.createEditor();
		
		editor.api.edit(Selection.start(), dedent(`
			module.exports = function(env) {
				@{$init.body}
				
				return @obj;
			}
		`));
		
		editor.on("edit", this.onEditReplaceWith.bind(this));
		
		return editor;
	}
	
	onEditFind() {
		this.find();
	}
	
	onEditReplaceWith() {
		this.updatePreview();
	}
	
	find() {
		try {
			this.results = codex.find(this.editors.results.document, this.editors.find.string);
			
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
	
	hiliteMatches() {
		this.editors.results.api.setNormalHilites(this.results.map(result => result.replaceSelection));
	}
	
	updatePaths() {
		return this.sync("updatePaths", async () => {
			let nodes = (await bluebird.map(this.options.globs, glob => platform.fs().glob(glob))).flat();
			
			nodes = await bluebird.filter(nodes, node => node.isFile());
			
			return nodes.map(node => node.path);
		}, (paths) => {
			this.paths = paths;
			
			this.fire("updatePaths");
			
			this.selectPath("/home/gus/projects/edita/src/modules/langs/javascript/index.js");
		});
	}
	
	selectPath(path) {
		return this.sync("selectPath", async () => {
			return await platform.fs(path).read();
		}, async (code) => {
			this.selectedFile = {path, code};
			
			await this.setResultsCode();
			
			this.find();
			
			await this.updatePreview();
		});
	}
	
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
	
	eachEditor(fn) {
		Object.values(this.editors).forEach(fn);
	}
}

module.exports = Refactor;
