let Evented = require("utils/Evented");
let {removeInPlace} = require("utils/arrayMethods");
let ipcRenderer = require("platform/modules/ipcRenderer");

class Snippets extends Evented {
	constructor() {
		super();
		
		this.snippets = [];
		
		ipcRenderer.on("snippets/new", this.onNewSnippet.bind(this));
		ipcRenderer.on("snippets/update", this.onSnippetUpdated.bind(this));
		ipcRenderer.on("snippets/delete", this.onSnippetDeleted.bind(this));
	}
	
	async init() {
		this.snippets = await ipcRenderer.invoke("snippets", "load");
	}
	
	all() {
		return this.snippets;
	}
	
	onNewSnippet(e, snippet) {
		this.snippets.push(snippet);
		
		this.fire("new", snippet);
	}
	
	onSnippetUpdated(e, id, snippet) {
		this.remove(this.findById(id));
		this.snippets.push(snippet);
		
		this.fire("update", id, snippet);
	}
	
	onSnippetDeleted(e, id) {
		this.remove(id);
		
		this.fire("delete", id);
	}
	
	findById(id) {
		return this.snippets.find(s => s.id === id);
	}
	
	remove(snippet) {
		removeInPlace(this.snippets, snippet);
	}
	
	async create(snippet) {
		await ipcRenderer.invoke("snippets", "create", snippet);
	}
	
	async save(snippet) {
		await ipcRenderer.invoke("snippets", "update", snippet.id, snippet);
	}
	
	async delete(snippet) {
		await ipcRenderer.invoke("snippets", "delete", snippet.id);
	}
}

module.exports = Snippets;
