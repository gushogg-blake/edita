let bluebird = require("bluebird");
let lid = require("utils/lid");
let Evented = require("utils/Evented");
let {removeInPlace} = require("utils/arrayMethods");

class Snippets extends Evented {
	constructor(fs) {
		super();
		
		this.fs = fs;
		this.snippetsDir = this.fs("/");
		this.snippets = [];
	}
	
	async init() {
		this.snippets = await bluebird.map(this.snippetsDir.ls(), node => node.readJson());
	}
	
	generateFilename(snippet) {
		let {id, name, langs, langGroups} = snippet;
		
		langs = langs.join("-");
		langGroups = langGroups.join("-");
		
		return [langGroups, langs, name, id].filter(Boolean).join("-") + ".json";
	}
	
	async getNode(id) {
		return (await this.snippetsDir.ls()).find(node => node.basename.endsWith("-" + id));
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
	
	findByLangAndKeyCombo(lang, keyCombo) {
		return this.snippets.find(function(snippet) {
			return snippet.keyCombo === keyCombo && (
				snippet.langGroups.includes(lang.group)
				|| snippet.langs.includes(lang.code)
			);
		});
	}
	
	async create(snippet) {
		snippet = {
			...snippet,
			id: snippet.id || lid(),
		};
		
		let node = this.snippetsDir.child(this.generateFilename(snippet));
		
		await node.writeJson(snippet);
		
		this.snippets.push(snippet);
		
		this.fire("new", snippet);
		
		return snippet.id;
	}
	
	async update(id, snippet) {
		snippet = {id, ...snippet};
		
		let node = await this.getNode(id);
		
		if (!node) {
			return;
		}
		
		await node.writeJson(snippet);
		
		this.snippets[this.findIndexById(id)] = snippet;
		
		this.fire("update", id, snippet);
	}
	
	async delete(id) {
		let node = await this.getNode(id);
		
		if (!node) {
			return;
		}
		
		await node.delete();
		
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
}

module.exports = Snippets;
