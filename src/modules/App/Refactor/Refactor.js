let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let sync = require("utils/sync");
let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");
let URL = require("modules/URL");
let codex = require("modules/codex");
let RefactorPreview = require("./RefactorPreview");

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
		};
		
		this.eachEditor(editor => editor.setWrap(true));
		
		this.paths = [];
		
		this.selectedFile = null;
		
		this.updatePaths();
	}
	
	createFindEditor() {
		let editor = this.app.createEditor();
		
		//editor.api.edit(Selection.start(), dedent(`
		//	(lexical_declaration (variable_declarator (identifier) @id))
		//`));
		
		editor.api.edit(Selection.start(), dedent(`
			let lang = (object
				(method_definition
					(property_identifier) @p
					(statement_block "{" (_)+ @body "}")
				) @-init
				.
				"," @-c
				(#eq? @p "init")
			) @obj/;?/
			
			module.exports = lang;
		`));
		
		editor.on("edit", this.onEditFind.bind(this));
		
		return editor;
	}
	
	createReplaceWithEditor() {
		let editor = this.app.createEditor();
		
		//editor.api.edit(Selection.start(), "@id");
		
		editor.api.edit(Selection.start(), dedent(`
			module.exports = function(env) {
				@body
				
				return @obj;
			}
		`).trimRight());
		
		editor.on("edit", this.onEditReplaceWith.bind(this));
		
		return editor;
	}
	
	onEditFind() {
		this.preview.find(this.editors.find.string);
	}
	
	onEditReplaceWith() {
		this.updatePreview();
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
			
			this.selectPath("/home/gus/projects/edita-main/src/modules/langs/javascript/index.js");
		});
	}
	
	selectPath(path) {
		return this.sync("selectPath", async () => {
			return await platform.fs(path).read();
		}, async (code) => {
			this.fire("selectFile", {path, code});
		});
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
