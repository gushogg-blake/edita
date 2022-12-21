let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let sync = require("utils/sync");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let codex = require("modules/codex");

let {s} = Selection;
let {c} = Cursor;

class Refactor extends Evented {
	constructor(app, options) {
		super();
		
		this.sync = sync();
		
		this.app = app;
		
		this.setOptions(options);
		
		this.editors = {
			match: this.createMatchEditor(),
			replaceWith: app.createEditor(),
			matchPreview: app.createEditor(),
			resultPreview: app.createEditor(),
		};
		
		let {match, replaceWith} = this.editors;
		
		for (let editor of [match, replaceWith]) {
			editor.view.setWrap(true);
		}
		
		this.paths = [];
		this.selectedPath = null;
		
		this.updatePaths();
		
		let dev = () => {
			let editor = this.editors.matchPreview;
			let {document} = editor;
			
			editor.api.edit(document.selectAll(), app.selectedTab.editor.document.string);
			document.setLang(base.langs.get("javascript"));
		};
		
		dev();
		
		this.editors.match.api.edit(Selection.start(), `f literal\n(function @f)\n`);
		
		app.on("selectTab", dev);
	}
	
	createMatchEditor() {
		let editor = app.createEditor();
		
		editor.on("edit", this.onEditMatch.bind(this));
		
		return editor;
	}
	
	onEditMatch() {
		this.hiliteMatches();
	}
	
	hiliteMatches() {
		try {
			let matches = codex.find(this.editors.matchPreview.document, this.editors.match.document.string);
			
			console.log(matches);
			
			this.editors.matchPreview.api.setNormalHilites(matches.map(m => m.selection));
		} catch (e) {
			if (e instanceof codex.ParseError) {
				console.log("Error parsing match query");
				console.log(e);
				
				if (e.cause) {
					console.log(e.cause);
				}
			} else {
				throw e;
			}
		}
	}
	
	updatePaths() {
		return this.sync("updatePaths", async () => {
			let nodes = (await bluebird.map(this.options.globs, glob => platform.fs().glob(glob))).flat();
			
			nodes = await bluebird.filter(nodes, node => node.isFile());
			
			return nodes.map(node => node.path);
		}, (paths) => {
			this.paths = paths;
			
			console.log(paths);
			
			this.fire("updatePaths");
			
			this.selectPath(paths[0] || null);
		});
	}
	
	selectPath(path) {
		let {document} = this.editors.matchPreview;
		
		//document.
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
