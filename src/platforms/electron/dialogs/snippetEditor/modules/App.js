let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let focusManager = require("utils/focusManager");
let Document = require("modules/Document");
let Editor = require("modules/Editor");
let View = require("modules/View");

class App extends Evented {
	constructor() {
		super();
		
		this.focusManager = focusManager();
	}
	
	async init(snippet) {
		let document = new Document(snippet.text, null);
		let view = new View(document);
		let editor = new Editor(document, view);
		
		this.editor = editor;
	}
}

module.exports = App;
