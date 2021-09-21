let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
	}
	
	async init() {
		let {snippetId} = this.options;
		
		this.isNew = !snippetId;
		
		if (this.isNew) {
			this.snippet = {
				name: "",
				langGroups: [],
				langs: [],
				text: "",
				isDynamic: false,
			};
			
			document.title = "New snippet";
		} else {
			this.snippet = await platform.snippets.findById(snippetId);
			
			document.title = this.snippet.name;
		}
	}
	
	async save(snippet) {
		if (this.isNew) {
			await platform.snippets.create(snippet);
		} else {
			await platform.snippets.update(this.options.snippetId, snippet);
		}
	}
}

module.exports = App;
