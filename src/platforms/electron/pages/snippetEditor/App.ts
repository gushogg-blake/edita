let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
	}
	
	async init() {
		let {id, details} = this.options;
		
		this.isNew = !id;
		
		if (this.isNew) {
			this.snippet = {
				name: "",
				langGroups: [],
				langs: [],
				text: "",
				isDynamic: false,
				...details,
			};
			
			document.title = "New snippet";
		} else {
			this.snippet = await platform.snippets.findById(id);
			
			document.title = this.snippet.name;
		}
	}
	
	async save(snippet) {
		if (this.isNew) {
			await platform.snippets.create(snippet);
		} else {
			await platform.snippets.update(this.options.id, snippet);
		}
	}
	
	teardown() {
		
	}
}

module.exports = App;
