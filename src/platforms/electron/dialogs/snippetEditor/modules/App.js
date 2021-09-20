let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let focusManager = require("utils/focusManager");
let Document = require("modules/Document");
let Editor = require("modules/Editor");
let View = require("modules/View");

class App extends Evented {
	constructor(options) {
		super();
		
		let {
			snippetId,
		} = options;

		this.snippetId = snippetId;
		this.focusManager = focusManager();
	}
	
	async init() {
		this.snippet = await platform.snippets.findById(this.snippetId);
	}
}

module.exports = App;
