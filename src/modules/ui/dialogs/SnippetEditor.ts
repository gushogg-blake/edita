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

export default App;
