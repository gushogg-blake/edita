import {Evented, lid, removeInPlace} from "utils";
import type {Lang} from "core";
import {JsonStore} from "base/stores";
import migrations from "./migrations";

export type Snippet = {
	id?: string;
	name: string;
	langGroups: string[];
	langs: string[];
	keyCombo: string | null;
	text: string;
};

export class SnippetsStore extends Evented<{
	create: Snippet;
	update: Snippet;
	delete: string;
}> {
	private store: JsonStore;
	private snippets: Snippet[];
	
	constructor() {
		super();
		
		this.store = new JsonStore("snippets", null, migrations);
		
		this.store.on("create", ({value}) => this.onCreate(value));
		this.store.on("update", ({value}) => this.onUpdate(value));
		this.store.on("delete", ({key}) => this.onDelete(key));
	}
	
	static createId(snippet: Snippet) {
		let {name, langs, langGroups} = snippet;
		
		return [langGroups.join("-"), langs.join("-"), name, lid()].filter(Boolean).join("-");
	}
	
	async init(): Promise<void> {
		this.snippets = Object.values(await this.store.loadAll());
	}
	
	all(): Snippet[] {
		return this.snippets;
	}
	
	async create(snippet: Snippet): Promise<string> {
		let id = SnippetsStore.createId(snippet);
		
		await this.store.create(id, {id, ...snippet});
		
		return id;
	}
	
	async update(id: string, snippet: Snippet): Promise<void> {
		await this.store.update(id, snippet);
	}
	
	async delete(id: string): Promise<void> {
		await this.store.delete(id);
	}
	
	findById(id: string): Snippet | undefined {
		return this.snippets.find(s => s.id === id);
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
	
	private onCreate(snippet: Snippet) {
		this.snippets.push(snippet);
		
		this.fire("create", snippet);
	}
	
	private onUpdate(snippet: Snippet) {
		let {id} = snippet;
		
		this.snippets[this.findIndexById(id)] = snippet;
		
		this.fire("update", snippet);
	}
	
	private onDelete(id: string) {
		this.remove(this.findById(id));
		
		this.fire("delete", id);
	}
	
	private findIndexById(id: string): number | undefined {
		return this.snippets.findIndex(s => s.id === id);
	}
	
	private remove(snippet: Snippet): void {
		removeInPlace(this.snippets, snippet);
	}
}

export default async function() {
	let store = new SnippetsStore();
	
	await store.init();
	
	return store;
}
