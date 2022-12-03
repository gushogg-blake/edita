let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let parseMatch = require("modules/refactor/parseMatch");

class Refactor extends Evented {
	constructor(app, options) {
		super();
		
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
		
		this.updatePaths();
		
		let dev = () => {
			let editor = this.editors.matchPreview;
			let {document} = editor;
			
			editor.api.edit(document.selectAll(), app.selectedTab.editor.document.string);
			document.setLang(base.langs.get("javascript"));
		};
		
		dev();
		
		app.on("selectTab", dev);
	}
	
	createMatchEditor() {
		let editor = app.createEditor();
		
		editor.on("edit", this.onEditMatch.bind(this));
		
		return editor;
	}
	
	onEditMatch() {
		this.findMatches();
	}
	
	
	
	findMatches() {
		try {
			let parts = parseMatch(this.editors.match.document.string);
			
			console.log(parts);
		} catch (e) {
			console.log("Error parsing match query");
			console.log(e);
		}
	}
	
	async updatePaths() {
		let paths = (await bluebird.map(this.options.globs, glob => platform.fs().glob(glob))).flat();
		
		console.log(paths);
	}
	
	setOptions(options) {
		this.options = options;
	}
	
	show() {
		Object.values(this.editors).forEach(editor => editor.view.show());
	}
	
	hide() {
		Object.values(this.editors).forEach(editor => editor.view.hide());
	}
}

module.exports = Refactor;
