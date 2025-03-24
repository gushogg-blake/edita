import Evented from "utils/Evented";

class App extends Evented {
	static requiresTreeSitter = true;
	
	constructor(env, options) {
		super();
		
		this.env = env;
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
			
			this.env.setTitle("New snippet");
		} else {
			this.snippet = await platform.snippets.findById(id);
			
			this.env.setTitle(this.snippet.name);
		}
	}
	
	saveAndClose(snippet) {
		if (this.isNew) {
			platform.snippets.create(snippet);
		} else {
			platform.snippets.update(this.options.id, snippet);
		}
		
		this.close();
	}
	
	close() {
		this.env.close();
	}
	
	teardown() {
		
	}
}

export default App;
