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
	
	findByLangAndName(lang, name) {
		return this.snippets.find(function(snippet) {
			return snippet.name === name && (
				snippet.langGroups.includes(lang.group)
				|| snippet.langs.includes(lang.code)
			);
		});
	}
	
	onNewSnippet(e, snippet) {
		console.trace(snippet);
		this.snippets.push(snippet);
		
		this.fire("new", snippet);
	}
	
	onSnippetUpdated(e, id, snippet) {
		this.snippets[this.findIndexById(id)] = snippet;
		
		this.fire("update", id, snippet);
	}
	
	onSnippetDeleted(e, id) {
		this.remove(this.findById(id));
		
		this.fire("delete", id);
	}
	
	findById(id) {
		return this.snippets.find(s => s.id === id);
	}
	
	findIndexById(id) {
		return this.snippets.findIndex(s => s.id === id);
	}
	
	remove(snippet) {
		removeInPlace(this.snippets, snippet);
	}
	
	async create(snippet) {
		await ipcRenderer.invoke("snippets", "create", snippet);
	}
	
	async update(id, snippet) {
		await ipcRenderer.invoke("snippets", "update", id, snippet);
	}
	
	async delete(id) {
		await ipcRenderer.invoke("snippets", "delete", id);
	}
}

module.exports = Snippets;
