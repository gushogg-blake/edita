import bluebird from "bluebird";
import {Evented, lid} from "utils";
import {removeInPlace} from "utils/array";
import SnippetsCommon, {type Snippet, type SnippetId} from "platforms/common/Snippets";

class Snippets extends SnippetsCommon {
	private fs: any; // fs
	private snippetsDir: any; // fs Node
	private snippets: Snippet[] = [];
	
	constructor(fs: any) {
		super();
		
		this.fs = fs;
		this.snippetsDir = this.fs("/");
		this.snippets = [];
	}
	
	async init() {
		this.snippets = await bluebird.map(this.snippetsDir.ls(), node => node.readJson());
	}
	
	private generateFilename(snippet) {
		let {id, name, langs, langGroups} = snippet;
		
		langs = langs.join("-");
		langGroups = langGroups.join("-");
		
		return [langGroups, langs, name, id].filter(Boolean).join("-") + ".json";
	}
	
	private async getNode(id) {
		return (await this.snippetsDir.ls()).find(node => node.basename.endsWith("-" + id));
	}
	
	all(): Snippet[] {
		return this.snippets;
	}
	
	findByLangAndName(lang: Lang, name: string): Snippet | undefined {
		return this.snippets.find(function(snippet) {
			return snippet.name === name && (
				snippet.langGroups.includes(lang.group)
				|| snippet.langs.includes(lang.code)
			);
		});
	}
	
	findByLangAndKeyCombo(lang: Lang, keyCombo: string): Snippet | undefined {
		return this.snippets.find(function(snippet) {
			return snippet.keyCombo === keyCombo && (
				snippet.langGroups.includes(lang.group)
				|| snippet.langs.includes(lang.code)
			);
		});
	}
	
	async create(snippet: Snippet): Promise<SnippetId> {
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
	
	async update(id: SnippetId, snippet: Snippet): Promise<void> {
		snippet = {id, ...snippet};
		
		let node = await this.getNode(id);
		
		if (!node) {
			return;
		}
		
		await node.writeJson(snippet);
		
		this.snippets[this.findIndexById(id)] = snippet;
		
		this.fire("update", {id, snippet});
	}
	
	async delete(id: SnippetId): Promise<void> {
		let node = await this.getNode(id);
		
		if (!node) {
			return;
		}
		
		await node.delete();
		
		this.remove(this.findById(id));
		
		this.fire("delete", id);
	}
	
	findById(id: SnippetId): Snippet | undefined {
		return this.snippets.find(s => s.id === id);
	}
	
	findIndexById(id: SnippetId): number {
		return this.snippets.findIndex(s => s.id === id);
	}
	
	private remove(snippet: Snippet): void {
		removeInPlace(this.snippets, snippet);
	}
}

export default Snippets;
